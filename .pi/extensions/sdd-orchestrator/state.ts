/**
 * Pure state-machine helpers for the SDD orchestrator.
 *
 * This module has NO dependency on the pi ExtensionAPI — only node built-ins —
 * so it can be unit-tested with `node --test` (see state.test.ts).
 */

import * as fs from "node:fs";
import * as path from "node:path";

export const CONFIG_DIR_NAME = ".pi";
export const STATE_FILE = "sdd-state.json";
export const SCHEMA_VERSION = "1.0";

export const PHASES = ["idle", "analyze", "spec", "implement", "review", "decide", "done"] as const;
export type Phase = (typeof PHASES)[number];

export const SPEC_STATUSES = ["draft", "approved", "in-progress", "done", "deprecated"] as const;
export type SpecStatus = (typeof SPEC_STATUSES)[number];

export const DECISIONS = ["approved", "needs-iteration", "done"] as const;
export type Decision = (typeof DECISIONS)[number];

export interface SddState {
	schemaVersion: string;
	currentPhase: Phase;
	activeSpec: string | null;
	specStatus: SpecStatus | null;
	lastDecision: Decision | null;
	updatedAt: string;
}

export function isValidPhase(value: unknown): value is Phase {
	return typeof value === "string" && (PHASES as readonly string[]).includes(value);
}

export function isValidSpecStatus(value: unknown): value is SpecStatus {
	return typeof value === "string" && (SPEC_STATUSES as readonly string[]).includes(value);
}

export function isValidDecision(value: unknown): value is Decision {
	return typeof value === "string" && (DECISIONS as readonly string[]).includes(value);
}

/** Fresh idle state with the current timestamp. */
export function createDefaultState(): SddState {
	return {
		schemaVersion: SCHEMA_VERSION,
		currentPhase: "idle",
		activeSpec: null,
		specStatus: null,
		lastDecision: null,
		updatedAt: new Date().toISOString(),
	};
}

/** Pure merge of a partial patch onto a state; bumps updatedAt. */
export function applyPatch(state: SddState, patch: Partial<SddState>): SddState {
	return { ...state, ...patch, updatedAt: new Date().toISOString() };
}

/**
 * Pure DECIDE transition (M1):
 * - approved -> specStatus "approved", phase "implement" (approve = implement now)
 * - done -> phase "done" (terminal), specStatus untouched
 * - needs-iteration -> phase "implement", specStatus untouched
 */
export function applyDecision(state: SddState, decision: Decision): SddState {
	if (decision === "approved") {
		return applyPatch(state, { currentPhase: "implement", specStatus: "approved", lastDecision: "approved" });
	}
	if (decision === "needs-iteration") {
		return applyPatch(state, { currentPhase: "implement", lastDecision: "needs-iteration" });
	}
	return applyPatch(state, { currentPhase: "done", lastDecision: "done" });
}

/** Absolute path of the flow-state file for a project root. */
export function stateFilePath(cwd: string): string {
	return path.join(cwd, CONFIG_DIR_NAME, STATE_FILE);
}

/**
 * Load the flow state from disk. Missing or corrupt files fall back to
 * defaults (never crash).
 */
export function loadState(cwd: string): SddState {
	try {
		const raw = JSON.parse(fs.readFileSync(stateFilePath(cwd), "utf8")) as Partial<SddState>;
		return {
			...createDefaultState(),
			...raw,
			updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
		};
	} catch {
		return createDefaultState();
	}
}

/** Persist the flow state atomically (temp file + rename). */
export function saveState(cwd: string, state: SddState): void {
	const file = stateFilePath(cwd);
	const next: SddState = { ...state, updatedAt: new Date().toISOString() };
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
	fs.renameSync(tmp, file);
}

/** Patch + persist in one step. */
export function transition(cwd: string, state: SddState, patch: Partial<SddState>): SddState {
	const next = applyPatch(state, patch);
	saveState(cwd, next);
	return next;
}
