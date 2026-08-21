/**
 * Unit tests for the pure state-machine helpers of the SDD orchestrator.
 * Run with `npm test` (node --test). No pi runtime required.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	SCHEMA_VERSION,
	createDefaultState,
	applyPatch,
	applyDecision,
	isValidPhase,
	isValidSpecStatus,
	isValidDecision,
	stateFilePath,
	loadState,
	saveState,
	transition,
	type SddState,
} from "./state.ts";

// -------------------------------------------------------------------- defaults

test("createDefaultState: starts idle with schemaVersion 1.0", () => {
	const s = createDefaultState();
	assert.equal(s.schemaVersion, SCHEMA_VERSION);
	assert.equal(s.currentPhase, "idle");
	assert.equal(s.activeSpec, null);
	assert.equal(s.specStatus, null);
	assert.equal(s.lastDecision, null);
	assert.ok(typeof s.updatedAt === "string" && !Number.isNaN(Date.parse(s.updatedAt)));
});

// ------------------------------------------------------------------- validators

test("isValidPhase: accepts all phase names", () => {
	for (const p of ["idle", "analyze", "spec", "implement", "review", "decide", "done"]) {
		assert.equal(isValidPhase(p), true, p);
	}
	assert.equal(isValidPhase("bogus"), false);
});

test("isValidSpecStatus: accepts the lifecycle statuses", () => {
	for (const s of ["draft", "approved", "in-progress", "done", "deprecated"]) {
		assert.equal(isValidSpecStatus(s), true, s);
	}
	assert.equal(isValidSpecStatus("weird"), false);
});

test("isValidDecision: accepts the decisions", () => {
	for (const d of ["approved", "needs-iteration", "done"]) {
		assert.equal(isValidDecision(d), true, d);
	}
	assert.equal(isValidDecision("maybe"), false);
});

// ----------------------------------------------------------------- applyPatch

test("applyPatch: merges a patch and bumps updatedAt", () => {
	const base = createDefaultState();
	const next = applyPatch(base, { currentPhase: "spec", activeSpec: "docs/features/x.md" });
	assert.equal(next.currentPhase, "spec");
	assert.equal(next.activeSpec, "docs/features/x.md");
	assert.equal(next.specStatus, null); // untouched
	assert.ok(!Number.isNaN(Date.parse(next.updatedAt)), "updatedAt stays a valid ISO timestamp");
});

// ---------------------------------------------------------------- applyDecision

test("applyDecision: approved -> specStatus approved, phase implement (M1)", () => {
	const state: SddState = { ...createDefaultState(), currentPhase: "review", activeSpec: "docs/features/x.md", specStatus: "draft", lastDecision: null };
	const next = applyDecision(state, "approved");
	assert.equal(next.specStatus, "approved");
	assert.equal(next.currentPhase, "implement");
	assert.equal(next.lastDecision, "approved");
});

test("applyDecision: done -> phase done, specStatus untouched", () => {
	const state: SddState = { ...createDefaultState(), currentPhase: "review", activeSpec: "docs/features/x.md", specStatus: "approved" };
	const next = applyDecision(state, "done");
	assert.equal(next.currentPhase, "done");
	assert.equal(next.lastDecision, "done");
	assert.equal(next.specStatus, "approved");
});

test("applyDecision: needs-iteration -> phase implement", () => {
	const state: SddState = { ...createDefaultState(), currentPhase: "review" };
	const next = applyDecision(state, "needs-iteration");
	assert.equal(next.currentPhase, "implement");
	assert.equal(next.lastDecision, "needs-iteration");
});

// --------------------------------------------------------------- stateFilePath

test("stateFilePath: resolves under .pi", () => {
	assert.equal(stateFilePath("/repo"), path.join("/repo", ".pi", "sdd-state.json"));
});

// ------------------------------------------------------- loadState / saveState

test("loadState: returns defaults when the file is missing", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-state-"));
	const s = loadState(dir);
	assert.equal(s.currentPhase, "idle");
	assert.equal(s.specStatus, null);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("loadState: returns defaults when the file is corrupt", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-state-"));
	fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(dir, ".pi", "sdd-state.json"), "{ not json !!!", "utf8");
	const s = loadState(dir);
	assert.equal(s.currentPhase, "idle");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("loadState/saveState: roundtrip persists fields", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-state-"));
	const state = applyPatch(createDefaultState(), { currentPhase: "implement", activeSpec: "docs/features/x.md", specStatus: "approved", lastDecision: "approved" });
	saveState(dir, state);
	const loaded = loadState(dir);
	assert.equal(loaded.currentPhase, "implement");
	assert.equal(loaded.activeSpec, "docs/features/x.md");
	assert.equal(loaded.specStatus, "approved");
	assert.equal(loaded.lastDecision, "approved");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("transition: persists and returns the patched state", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-state-"));
	const base = createDefaultState();
	const next = transition(dir, base, { currentPhase: "analyze" });
	assert.equal(next.currentPhase, "analyze");
	assert.equal(loadState(dir).currentPhase, "analyze");
	fs.rmSync(dir, { recursive: true, force: true });
});
