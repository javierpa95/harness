/**
 * Pure spec-status helpers for the SDD orchestrator.
 *
 * Text-level functions (parseSpecStatus/setSpecStatus) are pure and fully
 * unit-tested. The file-level wrappers and detection heuristics only depend
 * on node built-ins, so the whole module is testable with `node --test`
 * (see spec-status.test.ts) without the pi ExtensionAPI.
 */

import * as fs from "node:fs";
import type { SpecStatus } from "./state.ts";

const STATUS_HEADING = /^##\s*:?\s*status\s*:?\s*$/im;
const STATUS_VALUE = /`\s*([a-z][a-z-]*)\s*`/i;
const STATUS_BARE = /^\s*([a-z][a-z-]*)\s*$/im;

// Detection markers (lowercase, case-insensitive matching).
const FRONTEND_MARKERS = ["frontend", "ui ", "web", "component", "page ", "user interface", "apps/web", "react", "astro", "vue", "svelte"];
const BACKEND_MARKERS = ["backend", "api", "database", "migration", "endpoint", "schema", "services/", " auth", "server", "db "];
const PERSONAL_DATA_MARKERS = ["email", "personal data", "user data", "pii", "privacy", "gdpr", "phone", "address", "password"];

/**
 * Parse the `## Status` value from spec text. Tolerant of an optional colon
 * in the heading, casing differences, and surrounding whitespace (N3).
 * Returns null when the status is missing or not a known lifecycle status.
 */
export function parseSpecStatus(text: string): SpecStatus | null {
	const m = text.match(STATUS_HEADING);
	if (!m) return null;
	const tail = text.slice(m.index!);
	const status = tail.match(STATUS_VALUE) ?? tail.match(STATUS_BARE);
	const value = status?.[1]?.toLowerCase();
	return isValidStatusValue(value) ? (value as SpecStatus) : null;
}

/**
 * Replace the `## Status` value in spec text. Returns the new text, or null
 * when the heading/status line cannot be located. Pure (no I/O).
 */
export function setSpecStatus(text: string, status: SpecStatus): string | null {
	const m = text.match(STATUS_HEADING);
	if (!m) return null;
	const tailFrom = m.index! + m[0].length;
	const after = text.slice(tailFrom);
	const line = after.match(/^\s*`\s*[a-z][a-z-]*\s*`\s*$/im);
	if (!line) return null;
	const lineStart = tailFrom + line.index!;
	const lineEnd = lineStart + line[0].length;
	return `${text.slice(0, lineStart)}\`${status}\`${text.slice(lineEnd)}`;
}

/** Read the spec Status from a file. Returns null if unreadable/unparseable. */
export function readSpecStatusFile(specPath: string): SpecStatus | null {
	let text: string;
	try {
		text = fs.readFileSync(specPath, "utf8");
	} catch {
		return null;
	}
	return parseSpecStatus(text);
}

/** Write the spec Status into a file. Returns false if not possible. */
export function writeSpecStatusFile(specPath: string, status: SpecStatus): boolean {
	let text: string;
	try {
		text = fs.readFileSync(specPath, "utf8");
	} catch {
		return false;
	}
	const next = setSpecStatus(text, status);
	if (next === null) return false;
	try {
		fs.writeFileSync(specPath, next, "utf8");
		return true;
	} catch {
		return false;
	}
}

/** Normalize a user-provided spec name/path to a repo-relative markdown path. */
export function normalizeSpecPath(_cwd: string, input: string): string {
	let candidate = input.trim();
	if (!candidate.endsWith(".md")) candidate = `${candidate}.md`;
	if (candidate.startsWith("docs/") || candidate.startsWith("docs\\")) return candidate;
	if (candidate.includes("/") || candidate.includes("\\")) return candidate;
	return `docs/features/${candidate}`;
}

/** Decide which developer subagents a spec needs (frontend-only/backend-only/both). */
export function detectDevelopers(specText: string): { frontend: boolean; backend: boolean } {
	const lower = specText.toLowerCase();
	const frontend = FRONTEND_MARKERS.some((m) => lower.includes(m));
	const backend = BACKEND_MARKERS.some((m) => lower.includes(m));
	// No markers at all: assume both (safe default, user can confirm in TUI).
	return { frontend: frontend || (!frontend && !backend), backend: backend || (!frontend && !backend) };
}

/** Whether a spec involves personal data (parallel GDPR audit trigger). */
export function involvesPersonalData(specText: string): boolean {
	const lower = specText.toLowerCase();
	return PERSONAL_DATA_MARKERS.some((m) => lower.includes(m));
}

function isValidStatusValue(value: string | undefined): value is SpecStatus {
	return Boolean(value) && ["draft", "approved", "in-progress", "done", "deprecated"].includes(value);
}
