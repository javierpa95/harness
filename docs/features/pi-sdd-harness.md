# Feature: Pi SDD Harness

## Status

`approved`

## Overview

Port the opencode SDD (Specification-Driven Development) agent harness to pi, so the same ANALYZE → SPEC → IMPLEMENT → REVIEW → DECIDE workflow runs natively inside pi. The port consists of (1) a custom TypeScript orchestrator extension in `.pi/extensions/` that enforces the SDD phase order and drives the workflow, and (2) seven role-specific subagents defined as Markdown agent files in `.pi/agents/` that pi-spawns on demand via the `pi-subagents` package delegation mechanism. opencode (`.opencode/`) and pi (`.pi/`) coexist as complementary harnesses; this feature does not replace opencode.

## User Stories

1. As a developer using pi, I want to run `/analyze` and have the orchestrator delegate to the appropriate subagent so that the analysis phase starts without me manually spawning agents.
2. As a developer, I want to run `/spec` and have the orchestrator launch the `sdd-spec-writer` subagent so that a feature spec is created or updated in `docs/features/` following the mandatory format.
3. As a developer, I want the orchestrator to block `/implement` when no approved spec exists so that code is never written without an approved specification (SDD rule).
4. As a backend developer, I want the `sdd-backend-developer` subagent to write tests before code (TDD Red→Green→Refactor) so that each acceptance criterion is covered by at least one test.
5. As a reviewer, I want the `sdd-code-reviewer` subagent to verify the implementation against the spec using read-only tools so that review is non-destructive.
6. As a developer, I want `/sdd-status` to show the current phase and active spec so that I always know where the workflow stands.
7. As a release manager, I want the `sdd-release-manager` subagent to bump versions and update `docs/CHANGELOG.md` so that releases are tracked.
8. As a project owner, I want opencode (`.opencode/`) and pi (`.pi/`) to remain independent and complementary so that switching harnesses never breaks the other.

## Acceptance Criteria

### Installation & environment

- [ ] `pi install npm:pi-subagents` completes without errors on pi v0.82.1 with Node.js ≥ 18 or Bun, and `pi-subagents` (v0.42.1) appears in `pi list`.
- [ ] The package `pi-subagents` provides at least the built-in agents listed in the package documentation (scout, researcher, planner, worker, reviewer, context-builder, oracle, delegate) available for delegation.

### Custom subagents

- [ ] Seven custom agent files exist under `.pi/agents/**/*.md`: `sdd-spec-writer.md`, `sdd-frontend-developer.md`, `sdd-backend-developer.md`, `sdd-code-reviewer.md`, `sdd-gdpr-auditor.md`, `sdd-release-manager.md`, and a lightweight delegate (e.g. `sdd-delegate.md`) if required by the orchestrator.
- [ ] Each agent file has valid YAML frontmatter containing at least `name`, `description`, and a `tools` allowlist exactly as specified in the Data Contract below.
- [ ] `pi-subagents list` (or the package's listing command) shows all seven custom agents.
- [ ] `sdd-spec-writer` has `tools` restricted to `read, write, edit, grep, find, ls` — it cannot execute `bash`.
- [ ] `sdd-code-reviewer` and `sdd-gdpr-auditor` have `tools` restricted to `read, grep, find, ls` and are configured as read-only (no write/edit/bash).
- [ ] `sdd-backend-developer` includes `bash` in its `tools` allowlist and its system prompt instructs TDD (Red→Green→Refactor) for `services/`.
- [ ] `sdd-frontend-developer` includes `bash` in its `tools` allowlist and its system prompt instructs UI work in `apps/web/` without TDD.
- [ ] `sdd-release-manager` includes `bash` in its `tools` allowlist and its system prompt instructs versioning and changelog updates.

### Orchestrator extension

- [ ] A custom TypeScript extension exists in `.pi/extensions/` (e.g. `.pi/extensions/sdd-orchestrator.ts`) and loads without errors when pi starts (verified via `pi -e` or a clean pi session log).
- [ ] The extension registers commands `/analyze`, `/spec`, `/implement`, `/review`, `/decide`, and `/sdd-status`.
- [ ] Running `/analyze` transitions the flow state to `analyze` and delegates analysis work to the appropriate subagent via the pi-subagents delegation API.
- [ ] Running `/spec` transitions the flow state to `spec` and launches the `sdd-spec-writer` subagent; the spec file path is recorded in the flow state.
- [ ] Running `/implement` when the flow state is not `approved` (spec not yet approved) is rejected with a clear message and does not spawn any implementation agent.
- [ ] Running `/implement` when the flow state is `approved` launches the appropriate developer subagent(s) for the active spec.
- [ ] Running `/review` launches `sdd-code-reviewer` (and `sdd-gdpr-auditor` in parallel when the active spec involves user data).
- [ ] Running `/decide` after a successful review transitions the state to `done` and records the decision; the decision is visible in `/sdd-status`.
- [ ] `/sdd-status` prints the current phase, the active spec path, and the last decision without spawning any subagent.
- [ ] The orchestrator persists flow state so that a pi session restart does not lose the current phase or active spec.

### Delegation behavior

- [ ] The orchestrator delegates to subagents using the pi-subagents delegation/RPC API (exact API shape is TBD during implementation; the expected behavior is: the child agent receives the parent session context and runs as a pi child session).
- [ ] When a subagent fails (non-zero exit or timeout), the orchestrator reports the failure in the conversation and does not advance the flow state.

## Data Contract

### Entities / Models

#### Flow state (`sdd-state.json` or equivalent, stored under `.pi/`)

| Entity | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| SddState | schemaVersion | string | yes | Version of the state format, e.g. `"1.0"` |
| SddState | currentPhase | string | yes | One of `idle`, `analyze`, `spec`, `implement`, `review`, `decide`, `done` |
| SddState | activeSpec | string | no | Relative path of the current feature spec, e.g. `docs/features/pi-sdd-harness.md` |
| SddState | specStatus | string | no | Spec status from frontmatter: `draft`, `approved`, `in-progress`, `done`, `deprecated` |
| SddState | lastDecision | string | no | Last `/decide` outcome, e.g. `approved`, `needs-iteration`, `done` |
| SddState | updatedAt | string | yes | ISO-8601 timestamp of last state change |

Example:

```json
{
  "schemaVersion": "1.0",
  "currentPhase": "implement",
  "activeSpec": "docs/features/pi-sdd-harness.md",
  "specStatus": "approved",
  "lastDecision": "approved",
  "updatedAt": "2026-08-07T10:00:00Z"
}
```

#### Custom subagent (`.pi/agents/<name>.md`)

| Entity | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| Subagent | name | string (YAML) | yes | Unique agent name, e.g. `sdd-spec-writer` |
| Subagent | description | string (YAML) | yes | When this agent should be used |
| Subagent | tools | list (YAML) | yes | Strict tool allowlist per role (see table below) |
| Subagent | systemPromptMode | string (YAML) | no | `replace` (default) — agent prompt replaces pi base prompt |
| Subagent | inheritProjectContext | bool (YAML) | yes | `true` — inherits `AGENTS.md` |
| Subagent | memory | object (YAML) | no | Persistent memory scope/path under `.pi/agent-memory/` |
| Subagent | acceptanceRole | string (YAML) | no | `read-only` for reviewer/auditor agents |
| Subagent | completionGuard | bool (YAML) | no | `false` for agents that only mention implementation without editing |
| Subagent | body | markdown | yes | System prompt with the role instructions |

Tool allowlist per role (the contract):

| Agent file | Tools allowlist | Edits files? |
|------------|-----------------|--------------|
| `sdd-spec-writer.md` | read, write, edit, grep, find, ls | Yes — only `docs/features/` and `docs/CHANGELOG.md` |
| `sdd-frontend-developer.md` | read, write, edit, grep, find, ls, bash | Yes — `apps/web/` |
| `sdd-backend-developer.md` | read, write, edit, grep, find, ls, bash | Yes — `services/` |
| `sdd-code-reviewer.md` | read, grep, find, ls | No (read-only) |
| `sdd-gdpr-auditor.md` | read, grep, find, ls | No (read-only) |
| `sdd-release-manager.md` | read, write, edit, grep, find, ls, bash | Yes — versions + changelog |

#### Directory layout

```
.pi/
  settings.json                 Pi settings (trust project scope enabled)
  agents/
    sdd-spec-writer.md
    sdd-frontend-developer.md
    sdd-backend-developer.md
    sdd-code-reviewer.md
    sdd-gdpr-auditor.md
    sdd-release-manager.md
  extensions/
    sdd-orchestrator/           Orchesterer extension (TypeScript)
      package.json              pi extension manifest (name, type: extension, entry)
      index.ts                  Command registration + flow-state management
      delegation.ts             Wrapper over pi-subagents delegation API
  agent-memory/                 Persistent role memory (written by memory-enabled agents)
  sdd-state.json                Flow state (managed by the orchestrator)
```

### API Endpoints / Operations

These are pi-side commands, not HTTP endpoints.

| Operation | Auth | Description |
|-----------|------|-------------|
| `/analyze` | project trust | Orchestrator: transition to `analyze`, delegate analysis to an analysis subagent |
| `/spec` | project trust | Orchestrator: transition to `spec`, launch `sdd-spec-writer` for `docs/features/<feature>.md` |
| `/implement` | project trust | Orchestrator: reject unless `specStatus == approved`; else launch `sdd-frontend-developer` and/or `sdd-backend-developer` |
| `/review` | project trust | Orchestrator: launch `sdd-code-reviewer`; launch `sdd-gdpr-auditor` in parallel if the spec involves user data |
| `/decide` | project trust | Orchestrator: record decision, transition to `done` or back to `spec`/`implement` for iteration |
| `/sdd-status` | project trust | Orchestrator: print current phase, active spec, last decision (no subagent spawn) |
| `pi-subagents list` | n/a | Package tool: list available subagents (expects the 7 custom agents) |
| `subagent` tool (actions) | parent session | Builtin tool of pi-subagents: list, disable, enable, eject, reset, refine child sessions |

## Edge Cases

- **No spec exists**: `/spec` without a feature name or path prompts the user for the feature name; `/implement` is rejected because `activeSpec` is null and `specStatus` is not `approved`.
- **Spec already approved**: `/spec` on an already-approved spec warns the user and asks for confirmation before re-opening the spec (does not silently overwrite).
- **Subagent fails / times out**: the orchestrator reports the failure inline and keeps the flow state unchanged; the user can retry the same phase.
- **Subagent retry**: re-running the same phase after a failure must be idempotent — it re-spawns the subagent without corrupting `sdd-state.json`.
- **Tool not in allowlist**: if a subagent tries to use a tool outside its allowlist, the tool is unavailable to the child session (pi-subagents enforces the allowlist); the orchestrator logs the attempt.
- **Flow state file missing or corrupt**: `/sdd-status` and all phase commands fall back to `{ currentPhase: "idle" }` and display a warning; no command crashes.
- **pi session restart mid-flow**: state is persisted on disk, so the next session resumes at the recorded phase.
- **Frontend-only or backend-only spec**: `/implement` spawns only the relevant developer subagent(s); it must not force both.
- **Spec file deleted after approval**: `/implement` fails with a clear message that the active spec file does not exist.
- **Concurrent opencode and pi usage**: changes made through `.opencode/` do not affect `.pi/` state and vice versa; both harnesses read the same `docs/` and source folders, so specs and code remain the single source of truth.
- **Missing runtime**: `pi install` or extension load fails if Node.js/Bun is absent or incompatible — the extension must surface the error message clearly.

## Security / Privacy

- **Restricted write permissions by role**: only agents that produce artifacts (`sdd-spec-writer`, developers, `sdd-release-manager`) have `write`/`edit`; reviewer and auditor are read-only by construction (allowlist omits write/edit/bash).
- **Spec-writer scope enforcement**: `sdd-spec-writer` is instructed (and limited by its system prompt) to edit only `docs/features/` and `docs/CHANGELOG.md`; no credentials or source code.
- **No secrets**: agent prompts and the orchestrator must never contain hardcoded credentials, tokens, or production URLs; all secrets remain in environment variables.
- **Project trust**: `.pi/` is project-scoped configuration; the user must explicitly trust the project in pi. Loading an untrusted project's `.pi/` extensions/agents must be blocked by pi's trust model.
- **Parallel GDPR audit**: when the active spec involves personal data, `sdd-gdpr-auditor` runs alongside `sdd-code-reviewer`; the auditor's findings are reported but it never modifies files.
- **Child session isolation**: subagent sessions inherit only the tools listed in their allowlist; the orchestrator must not grant broader tools to children than the parent session.
- **Rate/abuse**: background subagents may consume resources; the orchestrator should cap concurrent background children (e.g. a configurable max of 3) and use `timeoutMs` defaults.

## Dependencies

- **pi** v0.82.1 (terminal harness, vanilla + extensible philosophy) — target environment.
- **pi-subagents** v0.42.1 (npm package by nicobailon, installed via `pi install npm:pi-subagents`) — provides the subagent spawn/delegation mechanism, built-in agents, and the `subagent` tool. Its transitive deps (jiti, typebox, yaml) are expected to be installed automatically.
- **TypeScript** + a TS runtime available to pi (Node.js ≥ 18 or Bun) — required for the custom orchestrator extension.
- **opencode harness** (`.opencode/`) — existing sibling harness; remains the reference for role definitions and SDD rules. This feature is complementary, not a migration.
- **Project structure** — `apps/web/` (frontend), `services/` (backend), `docs/features/` (specs), `docs/CHANGELOG.md` (changelog) must exist as in the template.

## Notes

- **Complementary, not a replacement**: `.opencode/` keeps working for opencode; `.pi/` is the pi-side harness. Both read the same `docs/` and source folders, so the SDD loop is driven by whichever harness the user chooses per session.
- **Orchestrator is custom; pi-subagents is the spawn mechanism**: pi-subagents is NOT used as the orchestrator. The SDD orchestrator is a custom TypeScript extension; pi-subagents only provides the delegation API used to spawn child agents. The exact delegation API shape is intentionally not specified here — it will be investigated during implementation against pi-subagents v0.42.1 docs/types.
- **pi philosophy**: pi is deliberately vanilla + extensible. The orchestrator should be a thin layer: commands + state machine + delegation, not a framework.
- **TDD split**: backend (`services/`) and utils/shared use TDD; frontend (`apps/web/`) does not — mirroring the project's AGENTS.md table.
- **Documentation**: once implemented, this feature must be reflected in `docs/architecture/system_overview.md` and `docs/CHANGELOG.md`.
- **Status lifecycle**: this spec starts as `draft`; it becomes `approved` after the orchestrator (`/decide`) reviews it, and `in-progress` when implementation starts.