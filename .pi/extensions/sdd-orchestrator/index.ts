/**
 * SDD Orchestrator — pi extension
 *
 * Enforces the Specification-Driven Development phase order inside pi:
 *
 *   ANALYZE -> SPEC -> IMPLEMENT -> REVIEW -> DECIDE
 *
 * Responsibilities:
 *   - Registers the /analyze, /spec, /implement, /review, /decide and
 *     /sdd-status commands.
 *   - Maintains the flow state in .pi/sdd-state.json (schemaVersion "1.0")
 *     and survives session restarts.
 *   - Gates /implement on an approved spec (SDD rule).
 *   - Delegates phase work to pi-subagents custom agents (sdd-*).
 *   - Caps concurrent background subagents (default 3, env-overridable).
 *
 * SDD decision flow (M1):
 *   - /spec launches sdd-spec-writer; the writer sets the spec Status to
 *     `approved` when complete (see buildSpecTask). The orchestrator re-reads
 *     the status after the run and stores it in the flow state.
 *   - /decide approved is the explicit manual approve path: it writes
 *     `approved` into the spec file AND the flow state, then moves to phase
 *     `implement` (approving a spec means "implement it now"). /decide done
 *     is the terminal phase (feature complete). /decide needs-iteration goes
 *     back to `implement`.
 *
 * Path-scoping (W3): pi-subagents agent frontmatter supports only
 * TOOL-level `permissions` ({ tool: allow|ask|deny }) — it has no
 * path-scoping like opencode's `permissions.edit.'docs/features/**'`. Tool
 * allowlists + system-prompt scope instructions are therefore the enforced
 * boundary; no fake path rules are added.
 *
 * The extension is intentionally thin: commands + state machine +
 * delegation. pi-subagents (v0.42.1) is the spawn mechanism; this extension
 * is the orchestrator.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { SubagentsClient, SubagentDelegationError } from "./delegation.ts";
import {
	createDefaultState,
	stateFilePath,
	loadState,
	saveState,
	transition,
	type Phase,
	type SpecStatus,
	type Decision,
	type SddState,
} from "./state.ts";
import {
	readSpecStatusFile,
	writeSpecStatusFile,
	normalizeSpecPath,
	detectDevelopers,
	involvesPersonalData,
} from "./spec-status.ts";

// Re-export the pure helpers so consumers can keep importing them from index.ts.
export * from "./state.ts";
export * from "./spec-status.ts";

const SUBAGENT_NAMES = {
	analyze: "sdd-delegate",
	spec: "sdd-spec-writer",
	frontend: "sdd-frontend-developer",
	backend: "sdd-backend-developer",
	reviewer: "sdd-code-reviewer",
	auditor: "sdd-gdpr-auditor",
} as const;

export default function sddOrchestrator(pi: ExtensionAPI): void {
	const client = new SubagentsClient(pi);
	let maxConcurrent = parseMaxConcurrent();

	// -------------------------------------------------------------- delegation

	function parseMaxConcurrent(): number {
		const raw = process.env.SDD_MAX_CONCURRENT_SUBAGENTS;
		const n = raw ? Number.parseInt(raw, 10) : NaN;
		return Number.isFinite(n) && n > 0 ? n : 3;
	}

	let activeRuns = 0;

	function acquireSlot(): boolean {
		if (activeRuns >= maxConcurrent) return false;
		activeRuns += 1;
		return true;
	}

	function releaseSlot(): void {
		activeRuns = Math.max(0, activeRuns - 1);
	}

	async function delegate(cwd: string, agent: string, task: string, ctx: ExtensionCommandContext, timeoutMs?: number) {
		if (!acquireSlot()) {
			throw new SubagentDelegationError("concurrency_cap", `Concurrency cap reached (${maxConcurrent} concurrent subagents). Retry when current runs finish.`);
		}
		try {
			notify(ctx, `Delegating to \`${agent}\`${timeoutMs ? ` (timeout ${Math.round(timeoutMs / 1000)}s)` : ""}...`);
			const result = await client.delegate({ agent, task, cwd }, timeoutMs);
			if (!result.success) {
				throw new SubagentDelegationError("subagent_failed", `\`${agent}\` ${result.error ? `failed: ${result.error}` : `ended with state '${result.state}'`}`);
			}
			return result;
		} finally {
			releaseSlot();
		}
	}

	async function delegateAll(cwd: string, jobs: Array<{ agent: string; task: string }>, ctx: ExtensionCommandContext, timeoutMs?: number) {
		return Promise.all(jobs.map((job) => delegate(cwd, job.agent, job.task, ctx, timeoutMs)));
	}

	// ------------------------------------------------------------------ output
	// W2: headless-safe output. With a UI use ctx.ui.notify; without a UI use
	// console.log. Note: pi.sendMessage({display:true}) — the pattern
	// pi-subagents uses for its own slash commands — does NOT reach stdout in
	// print mode (pi's print-mode.js writes only the final assistant message),
	// so console.log is the reliable headless channel. json mode stays silent.

	function notify(ctx: ExtensionContext, text: string): void {
		if (ctx.hasUI) {
			ctx.ui.notify(text, "info");
		} else if (ctx.mode !== "json") {
			// print mode: pi.sendMessage({display:true}) never reaches stdout
			// (pi's print-mode.js only writes the final assistant message), so
			// console.log is the reliable headless channel. json mode stays
			// silent to keep the structured output valid.
			console.log(text);
		}
	}

	function notifyError(ctx: ExtensionContext, text: string): void {
		if (ctx.hasUI) {
			ctx.ui.notify(text, "error");
		} else if (ctx.mode !== "json") {
			console.error(`[sdd-orchestrator] ${text}`);
		}
	}

	function formatStatus(state: SddState): string {
		const lines = [
			"━━━ SDD Status ━━━",
			`Phase:        ${state.currentPhase}`,
			`Active spec:  ${state.activeSpec ?? "(none)"}`,
			`Spec status:  ${state.specStatus ?? "(none)"}`,
			`Last decision:${state.lastDecision ?? "(none)"}`,
			`Updated:      ${state.updatedAt}`,
		];
		return lines.join("\n");
	}

	// Soft order gates (N6): warn when a phase is entered out of order, but
	// never block — the user drives the workflow manually.
	function warnOrder(ctx: ExtensionCommandContext, expected: string[], actual: Phase): void {
		if (!expected.includes(actual)) {
			notify(ctx, `Note: current phase is '${actual}'; expected one of ${expected.join("/")} before this step. Proceeding anyway (manual flow).`);
		}
	}

	// --------------------------------------------------------- command bodies

	async function cmdAnalyze(args: string, ctx: ExtensionCommandContext): Promise<void> {
		const cwd = ctx.cwd;
		const state = loadState(cwd);
		let request = args.trim();
		if (!request) {
			if (ctx.hasUI) {
				const answer = await ctx.ui.input("Analyze", "What should the orchestrator analyze?");
				request = (answer ?? "").trim();
			}
			if (!request) {
				notifyError(ctx, "/analyze requires a request. Usage: /analyze <request>");
				return;
			}
		}
		transition(cwd, state, { currentPhase: "analyze" });
		notify(ctx, "Phase → analyze.");
		try {
			const result = await delegate(cwd, SUBAGENT_NAMES.analyze, buildAnalyzeTask(request), ctx);
			notify(ctx, result.output ?? result.summary ?? "Analysis complete.");
		} catch (error) {
			notifyError(ctx, `Analysis failed; state stays at 'analyze'. ${messageOf(error)}`);
		}
	}

	async function cmdSpec(args: string, ctx: ExtensionCommandContext): Promise<void> {
		const cwd = ctx.cwd;
		const state = loadState(cwd);
		warnOrder(ctx, ["idle", "analyze"], state.currentPhase);
		let rawName = args.trim();
		if (!rawName) {
			if (ctx.hasUI) {
				const answer = await ctx.ui.input("Spec", "Feature name (e.g. user-auth) or path to an existing spec:");
				rawName = (answer ?? "").trim();
			}
			if (!rawName) {
				notifyError(ctx, "/spec requires a feature name or spec path. Usage: /spec <feature-name|path>");
				return;
			}
		}
		const specPath = normalizeSpecPath(cwd, rawName);
		const existingStatus = readSpecStatusFile(path.join(cwd, specPath));

		// W4: warn before re-opening ANY spec already approved on disk —
		// regardless of the active state — and never silently overwrite.
		if (existingStatus === "approved") {
			const proceed = ctx.hasUI
				? await ctx.ui.confirm("Spec already approved", `'${specPath}' is approved. Re-open it and overwrite?`)
				: false;
			if (!proceed) {
				notify(ctx, `Spec '${specPath}' left unchanged.`);
				return;
			}
		}

		transition(cwd, state, { currentPhase: "spec", activeSpec: specPath, specStatus: existingStatus ?? "draft" });
		notify(ctx, `Phase → spec. Active spec: ${specPath}`);
		try {
			await delegate(cwd, SUBAGENT_NAMES.spec, buildSpecTask(specPath), ctx);
			const afterStatus = readSpecStatusFile(path.join(cwd, specPath));
			transition(cwd, loadState(cwd), { specStatus: afterStatus ?? "draft" });
			notify(ctx, `Spec '${specPath}' ready. Status: ${afterStatus ?? "unknown"}`);
		} catch (error) {
			notifyError(ctx, `Spec writer failed; state stays at 'spec'. ${messageOf(error)}`);
		}
	}

	async function cmdImplement(_args: string, ctx: ExtensionCommandContext): Promise<void> {
		const cwd = ctx.cwd;
		const state = loadState(cwd);

		if (!state.activeSpec) {
			notifyError(ctx, "No active spec. Run /spec <feature-name> first. Code is never written without an approved spec (SDD rule).");
			return;
		}
		if (state.specStatus !== "approved") {
			notifyError(ctx, `GATE: spec '${state.activeSpec}' is not approved (status: ${state.specStatus ?? "none"}). Approve the spec before implementing.`);
			return;
		}
		const absSpec = path.join(cwd, state.activeSpec);
		if (!fs.existsSync(absSpec)) {
			notifyError(ctx, `GATE: active spec file does not exist: ${state.activeSpec}. Restore it or re-run /spec.`);
			return;
		}

		const specText = readSpecText(absSpec);
		const detected = detectDevelopers(specText);

		let runFrontend = detected.frontend;
		let runBackend = detected.backend;
		if (ctx.hasUI) {
			const choices: string[] = [];
			if (detected.frontend) choices.push("frontend");
			if (detected.backend) choices.push("backend");
			if (choices.length === 2) choices.push("both");
			const picked = await ctx.ui.select("Implement with which developers?", choices);
			if (!picked) {
				notify(ctx, "/implement cancelled.");
				return;
			}
			runFrontend = picked === "frontend" || picked === "both";
			runBackend = picked === "backend" || picked === "both";
		}

		const jobs: Array<{ agent: string; task: string }> = [];
		if (runFrontend) jobs.push({ agent: SUBAGENT_NAMES.frontend, task: buildImplementTask(state.activeSpec) });
		if (runBackend) jobs.push({ agent: SUBAGENT_NAMES.backend, task: buildImplementTask(state.activeSpec) });
		if (jobs.length === 0) {
			notifyError(ctx, "No developer subagent matched this spec. Check the spec mentions frontend/backend concerns.");
			return;
		}

		transition(cwd, state, { currentPhase: "implement" });
		notify(ctx, `Phase → implement. Launching: ${jobs.map((j) => j.agent).join(", ")}`);
		try {
			const results = await delegateAll(cwd, jobs, ctx);
			for (const r of results) notify(ctx, `\`${r.agent}\` done:\n${r.output ?? r.summary ?? ""}`);
			// N5: developers set the spec Status to done in the file; sync the
			// flow state with the real file status after the run.
			const afterStatus = readSpecStatusFile(absSpec);
			if (afterStatus && afterStatus !== loadState(cwd).specStatus) {
				transition(cwd, loadState(cwd), { specStatus: afterStatus });
				notify(ctx, `Spec status synced: ${afterStatus}.`);
			}
		} catch (error) {
			notifyError(ctx, `Implementation failed; state stays at 'implement'. ${messageOf(error)}`);
		}
	}

	async function cmdReview(_args: string, ctx: ExtensionCommandContext): Promise<void> {
		const cwd = ctx.cwd;
		const state = loadState(cwd);
		warnOrder(ctx, ["implement", "spec"], state.currentPhase);
		if (!state.activeSpec) {
			notifyError(ctx, "No active spec to review against. Run /spec first.");
			return;
		}
		const absSpec = path.join(cwd, state.activeSpec);
		if (!fs.existsSync(absSpec)) {
			notifyError(ctx, `Active spec file does not exist: ${state.activeSpec}.`);
			return;
		}

		const specText = readSpecText(absSpec);
		const jobs: Array<{ agent: string; task: string }> = [{ agent: SUBAGENT_NAMES.reviewer, task: buildReviewTask(state.activeSpec) }];
		const audit = involvesPersonalData(specText);
		if (audit) jobs.push({ agent: SUBAGENT_NAMES.auditor, task: buildAuditTask(state.activeSpec) });

		transition(cwd, state, { currentPhase: "review" });
		notify(ctx, `Phase → review. Launching: ${jobs.map((j) => j.agent).join(", ")}${audit ? " (parallel GDPR audit)" : ""}`);
		try {
			const results = await delegateAll(cwd, jobs, ctx);
			for (const r of results) notify(ctx, `\`${r.agent}\` report:\n${r.output ?? r.summary ?? ""}`);
			notify(ctx, "Review done. Run /decide approved | needs-iteration | done.");
		} catch (error) {
			notifyError(ctx, `Review failed; state stays at 'review'. ${messageOf(error)}`);
		}
	}

	async function cmdDecide(args: string, ctx: ExtensionCommandContext): Promise<void> {
		const cwd = ctx.cwd;
		const state = loadState(cwd);
		warnOrder(ctx, ["review", "implement", "spec"], state.currentPhase);
		let decision = args.trim() as Decision;
		if (!decision) {
			if (ctx.hasUI) {
				const picked = await ctx.ui.select("Decision", [...DECISIONS]);
				decision = (picked ?? "") as Decision;
			}
			if (!decision) {
				notifyError(ctx, "/decide requires a decision. Usage: /decide approved | needs-iteration | done");
				return;
			}
		}
		if (!(DECISIONS as readonly string[]).includes(decision)) {
			notifyError(ctx, `Invalid decision '${decision}'. Valid: ${DECISIONS.join(", ")}`);
			return;
		}

		if (decision === "approved") {
			// M1: approving the spec is the deterministic path to specStatus
			// "approved" so /implement can never deadlock behind a draft spec.
			if (!state.activeSpec) {
				notifyError(ctx, "Cannot approve: no active spec. Run /spec <feature-name> first.");
				return;
			}
			const absSpec = path.join(cwd, state.activeSpec);
			if (!fs.existsSync(absSpec)) {
				notifyError(ctx, `Cannot approve: active spec file does not exist: ${state.activeSpec}. Restore it or re-run /spec.`);
				return;
			}
			const wrote = writeSpecStatusFile(absSpec, "approved");
			if (!wrote) {
				notify(ctx, "Warning: could not update the spec file Status to `approved`; the flow state was updated anyway.");
			}
			const next = transition(cwd, state, { currentPhase: "implement", specStatus: "approved", lastDecision: "approved" });
			notify(ctx, `Spec '${state.activeSpec}' approved. Phase → implement (ready to implement).`);
			void next;
			return;
		}

		if (decision === "needs-iteration") {
			const next = transition(cwd, state, { currentPhase: "implement", lastDecision: "needs-iteration" });
			notify(ctx, `Decision recorded: needs-iteration. Phase → implement.`);
			void next;
			return;
		}

		const next = transition(cwd, state, { currentPhase: "done", lastDecision: "done" });
		notify(ctx, `Decision recorded: done. Phase → done.`);
		void next;
	}

	async function cmdStatus(_args: string, ctx: ExtensionCommandContext): Promise<void> {
		const state = loadState(ctx.cwd);
		if (!fs.existsSync(stateFilePath(ctx.cwd))) {
			notify(ctx, "sdd-state.json missing — showing defaults.");
		}
		notify(ctx, formatStatus(state));
		// N5: surface drift between the flow state and the spec file on disk.
		if (state.activeSpec) {
			const realStatus = readSpecStatusFile(path.join(ctx.cwd, state.activeSpec));
			if (realStatus && realStatus !== state.specStatus) {
				notify(ctx, `Note: spec file on disk says '${realStatus}' (flow state says '${state.specStatus ?? "none"}').`);
			}
		}
	}

	// --------------------------------------------------------------- task text

	function buildAnalyzeTask(request: string): string {
		return [
			"SDD /analyze",
			`Analyze this request: "${request}"`,
			"",
			"1. Understand the request and its scope.",
			"2. Check whether an existing spec covers it in docs/features/ (list files, read candidates).",
			"3. Identify whether backend (TDD applies in services/) and/or frontend (apps/web/, no TDD) work is needed.",
			"4. Note risks, open questions, and a recommended spec name.",
			"Report findings concisely. Do not implement anything.",
		].join("\n");
	}

	function buildSpecTask(specPath: string): string {
		return [
			"SDD /spec",
			`Create or update the feature spec at: ${specPath}`,
			"",
			"Follow the mandatory spec format (Overview, User Stories, Acceptance Criteria, Data Contract, Edge Cases, Security/Privacy, Dependencies, Notes).",
			"Acceptance criteria must be verifiable test cases.",
			// M1: the writer leaves the spec ready-to-implement; the orchestrator
			// re-reads this status and /decide approved is the manual fallback.
			"Set the Status field to `approved` when the spec is complete and ready for implementation.",
			"Only edit docs/features/ and docs/CHANGELOG.md.",
		].join("\n");
	}

	function buildImplementTask(specPath: string): string {
		return [
			"SDD /implement",
			`Implement the approved spec: ${specPath}`,
			"",
			"Read the spec fully. Implement ONLY what the spec says.",
			"Backend: TDD (Red → Green → Refactor) for every acceptance criterion in services/.",
			"Frontend: implement UI in apps/web/ (no TDD for UI; TDD for pure utils).",
			"Update the spec Status to `in-progress` → `done` when finished.",
			"Report a summary with files changed and verification results.",
		].join("\n");
	}

	function buildReviewTask(specPath: string): string {
		return [
			"SDD /review",
			`Review the implementation against the spec: ${specPath}`,
			"",
			"Use the review checklist: spec compliance, bugs/edge cases, security, tests (backend TDD), code quality, documentation.",
			"Report findings with severity (critical/warning/info) and a verdict (PASS / FAIL / PASS WITH WARNINGS).",
			"You are read-only: never edit files.",
		].join("\n");
	}

	function buildAuditTask(specPath: string): string {
		return [
			"SDD /review (GDPR audit)",
			`Audit the implementation of: ${specPath}`,
			"",
			"The spec involves personal data. Audit for hardcoded credentials, security anti-patterns, and privacy issues.",
			"Report with severity (CRITICAL/WARNING/INFO) and an executive summary.",
			"You are read-only: never edit files.",
		].join("\n");
	}

	// ------------------------------------------------------------ registration

	pi.registerCommand("analyze", {
		description: "SDD: start the ANALYZE phase. Delegates analysis to sdd-delegate. Usage: /analyze <request>",
		handler: cmdAnalyze,
	});
	pi.registerCommand("spec", {
		description: "SDD: start the SPEC phase. Launches sdd-spec-writer. Usage: /spec <feature-name|path>",
		handler: cmdSpec,
	});
	pi.registerCommand("implement", {
		description: "SDD: start the IMPLEMENT phase (requires an approved spec). Launches sdd-frontend/backend-developer.",
		handler: cmdImplement,
	});
	pi.registerCommand("review", {
		description: "SDD: start the REVIEW phase. Launches sdd-code-reviewer (+ sdd-gdpr-auditor for personal data).",
		handler: cmdReview,
	});
	pi.registerCommand("decide", {
		description: "SDD: record the DECIDE outcome. Usage: /decide approved | needs-iteration | done",
		handler: cmdDecide,
	});
	pi.registerCommand("sdd-status", {
		description: "SDD: show the current phase, active spec, and last decision (no subagent spawned).",
		handler: cmdStatus,
	});

	// Load fresh state on session start (survives restarts and /reload).
	pi.on("session_start", async (_event, ctx) => {
		maxConcurrent = parseMaxConcurrent();
		const file = stateFilePath(ctx.cwd);
		if (!fs.existsSync(file)) {
			saveState(ctx.cwd, createDefaultState());
		}
	});
}

function readSpecText(specPath: string): string {
	try {
		return fs.readFileSync(specPath, "utf8");
	} catch {
		return "";
	}
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
