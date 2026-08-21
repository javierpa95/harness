/**
 * Unit tests for the pure spec-status helpers of the SDD orchestrator.
 * Run with `npm test` (node --test). No pi runtime required.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	parseSpecStatus,
	setSpecStatus,
	readSpecStatusFile,
	writeSpecStatusFile,
	normalizeSpecPath,
	detectDevelopers,
	involvesPersonalData,
} from "./spec-status.ts";

// ---------------------------------------------------------------- parseSpecStatus

test("parseSpecStatus: reads draft from the standard format", () => {
	const text = "# Feature: X\n\n## Status\n\n`draft`\n\n## Overview\n";
	assert.equal(parseSpecStatus(text), "draft");
});

test("parseSpecStatus: tolerates a colon in the heading", () => {
	const text = "# F\n\n## Status:\n\n`approved`\n";
	assert.equal(parseSpecStatus(text), "approved");
});

test("parseSpecStatus: is case-insensitive for heading and status value", () => {
	const text = "# F\n\n## status\n\n`IN-PROGRESS`\n";
	assert.equal(parseSpecStatus(text), "in-progress");
});

test("parseSpecStatus: works without a blank line before the status", () => {
	const text = "# F\n\n## Status\n`approved`\n";
	assert.equal(parseSpecStatus(text), "approved");
});

test("parseSpecStatus: accepts a bare status without backticks", () => {
	const text = "# F\n\n## Status\n\ndone\n";
	assert.equal(parseSpecStatus(text), "done");
});

test("parseSpecStatus: rejects an unknown status", () => {
	const text = "# F\n\n## Status\n\n`weird`\n";
	assert.equal(parseSpecStatus(text), null);
});

test("parseSpecStatus: returns null when the heading is missing", () => {
	assert.equal(parseSpecStatus("# F\n\n`draft`\n"), null);
});

// ---------------------------------------------------------------- setSpecStatus

test("setSpecStatus: replaces draft with approved and preserves the document", () => {
	const text = "# Feature: X\n\n## Status\n\n`draft`\n\n## Overview\n\nBackend API work.\n";
	const next = setSpecStatus(text, "approved");
	assert.notEqual(next, null);
	assert.equal(parseSpecStatus(next!), "approved");
	assert.ok(next!.includes("# Feature: X"));
	assert.ok(next!.includes("## Overview"));
	assert.ok(next!.includes("Backend API work."));
});

test("setSpecStatus: respects an existing colon heading", () => {
	const text = "# F\n\n## Status:\n\n`draft`\n";
	const next = setSpecStatus(text, "done");
	assert.notEqual(next, null);
	assert.equal(parseSpecStatus(next!), "done");
});

test("setSpecStatus: returns null when the heading is missing", () => {
	assert.equal(setSpecStatus("# F\n\n`draft`\n", "approved"), null);
});

test("setSpecStatus: returns null when no status line exists after the heading", () => {
	assert.equal(setSpecStatus("# F\n\n## Status\n\nNo status here.\n", "approved"), null);
});

// ---------------------------------------------------------- readSpecStatusFile

test("readSpecStatusFile: reads from disk", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-spec-"));
	const file = path.join(dir, "spec.md");
	fs.writeFileSync(file, "# F\n\n## Status\n\n`approved`\n", "utf8");
	assert.equal(readSpecStatusFile(file), "approved");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("readSpecStatusFile: returns null for a missing file", () => {
	assert.equal(readSpecStatusFile(path.join(os.tmpdir(), "sdd-missing-spec.md")), null);
});

// --------------------------------------------------------- writeSpecStatusFile

test("writeSpecStatusFile: writes the status to disk and re-reads it", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-spec-"));
	const file = path.join(dir, "spec.md");
	fs.writeFileSync(file, "# F\n\n## Status\n\n`draft`\n\n## Overview\n", "utf8");
	assert.equal(writeSpecStatusFile(file, "approved"), true);
	assert.equal(readSpecStatusFile(file), "approved");
	assert.ok(fs.readFileSync(file, "utf8").includes("## Overview"));
	fs.rmSync(dir, { recursive: true, force: true });
});

test("writeSpecStatusFile: returns false for a missing file", () => {
	assert.equal(writeSpecStatusFile(path.join(os.tmpdir(), "sdd-missing-spec.md"), "approved"), false);
});

// ------------------------------------------------------------- normalizeSpecPath

test("normalizeSpecPath: bare feature name goes to docs/features", () => {
	assert.equal(normalizeSpecPath("/repo", "user-auth"), "docs/features/user-auth.md");
});

test("normalizeSpecPath: appends .md when missing", () => {
	assert.equal(normalizeSpecPath("/repo", "user-auth.md"), "docs/features/user-auth.md");
});

test("normalizeSpecPath: keeps an existing docs/ prefix", () => {
	assert.equal(normalizeSpecPath("/repo", "docs/features/user-auth.md"), "docs/features/user-auth.md");
	assert.equal(normalizeSpecPath("/repo", "docs/other.md"), "docs/other.md");
});

test("normalizeSpecPath: keeps explicit relative paths", () => {
	assert.equal(normalizeSpecPath("/repo", "sub/dir/spec.md"), "sub/dir/spec.md");
});

// -------------------------------------------------------------- detectDevelopers

test("detectDevelopers: backend-only spec", () => {
	const r = detectDevelopers("# F\n\n## Overview\n\nBackend API and database migrations.\n");
	assert.deepEqual(r, { frontend: false, backend: true });
});

test("detectDevelopers: frontend-only spec", () => {
	const r = detectDevelopers("# F\n\n## Overview\n\nBuild the login UI component.\n");
	assert.deepEqual(r, { frontend: true, backend: false });
});

test("detectDevelopers: both when spec mentions both", () => {
	const r = detectDevelopers("# F\n\nAPI endpoints and a React page.\n");
	assert.deepEqual(r, { frontend: true, backend: true });
});

test("detectDevelopers: defaults to both when no markers match", () => {
	const r = detectDevelopers("# F\n\nJust a tiny helper.\n");
	assert.deepEqual(r, { frontend: true, backend: true });
});

// ---------------------------------------------------------- involvesPersonalData

test("involvesPersonalData: true for email handling", () => {
	assert.equal(involvesPersonalData("The app stores user emails for notifications."), true);
});

test("involvesPersonalData: true for privacy/GDPR mentions", () => {
	assert.equal(involvesPersonalData("Follow the GDPR rules for personal data."), true);
});

test("involvesPersonalData: false for neutral text", () => {
	assert.equal(involvesPersonalData("A simple counter component."), false);
});
