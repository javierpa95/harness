# Changelog

Todos los cambios notables en este proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- `harness-arquitect` primary agent (OpenCode-only): meta-agent that configures and evolves the harness itself; full edit/bash permissions with `.env*` still denied
- `docs/harness/opencode-docs.md`: verified knowledge base of official OpenCode docs (permissions first), maintained by harness-arquitect
- MCP integration: codegraph, context7, engram servers pre-configured and enabled in `.opencode/opencode.jsonc` and `.claude/settings.json`
- `docs/harness/` educational doc directory with: MCP-integration.md, agents-patterns.md, sdd-advanced.md
- Agent tool patterns: CodeGraph, Context7, Engram integration with SDD flow
- `harness-guide` skill: on-demand onboarding guide for new users (agents, commands, memory, permissions, make tricks)
- Harness CLI: `.opencode/scripts/harness.mjs` (zero-dep Node) with `models`, `model <agent> <provider/model|inherit>`, `skills`, `backlog [project|harness]`, and an interactive TUI menu (`make tui`, v0)
- Make targets: `make models`, `make model AGENT=x MODEL=y|inherit`, `make tui`
- `docs/harness/BACKLOG.md`: evolution backlog for the harness (TUI ideas first)
- **Project backlog** `docs/BACKLOG.md`: where every not-now idea/debt goes; wired into AGENTS.md workflow rules, `/start` session ritual and the TUI backlog view (press `b` to toggle project/harness source)
- OpenCode setup detection in `models` command and TUI "Proveedores" view: global+project config merge, authenticated providers from `auth.json` (names only), declared model IDs per provider, json-level agent overrides
- **Health audit**: new `make doctor` command and TUI "Auditoria" view (expandable per-agent findings) checking memory writability vs edit rules, traitor flat `read: 'allow'`, model id format, default_agent validity and deprecated config; includes a glob matcher faithful to OpenCode wildcard semantics (`*` crosses `/`, `**/` = zero or more segments)
- Dashboard quick wins: `r` redraws from anywhere, agent count summary line
- Interactive dashboard v1: arrow-key navigation, 5 views (Agents & Models with inline model change/inherit, Skills, dual-source Backlog, Providers, Help), git status header; raw keypress rendering with zero dependencies
- **`make update`**: syncs harness-owned files from a template checkout into existing projects with 4-way classification (install/update/current/conflict via `.opencode/harness-sync.json` manifest), rename-aware architect mapping (reads `default_agent`), conflicts written as `<file>.new` for manual review. Agents deleted by init are respected and never resurrected (`RESTORE=1` opts in). Project-owned files are never touched. `make update-dry` previews. See `docs/harness/UPDATE.md`.
- `fix(harness)`: dashboard crash on launch (`emitKeypressEvents` imported from the wrong readline module); `i` shortcut wired in agents view

### Fixed
- MCP servers: fix npm 404 packages. CodeGraph now uses `@astudioplus/codegraph-mcp`; Engram uses the native local binary `engram mcp --tools=agent` (no longer the nonexistent `@gentlest-mcp/*`). All three MCPs (codegraph, context7, engram) now active by default for an out-of-the-box harness in both `.opencode/opencode.jsonc` and `.claude/settings.json`.
- Permission rule ordering in all granular agents: catch-all (`'*'`) now comes FIRST, specific rules AFTER ("last matching rule wins" per official docs); previous ordering silently denied whitelisted commands
- **CRITICAL**: `init.sh` never updated `default_agent` when renaming project-architect, so clones created on Linux/macOS silently fell back to the built-in `build` agent; init.sh now mirrors init.ps1 behavior
- Agent permissions audit: code-reviewer/gdpr-auditor/docs-auditor/backend-developer can now write their own `agent-memory/` notes; bash whitelists use exact+wildcard pairs (patterns without `*` only match bare commands); removed flat `read: 'allow'` that bypassed the global `.env*` read deny; project-architect re-denies `.env*` edits
- Removed dead/deprecated agent config: `tools: {'*': true}` blocks (deprecated since v1.1.1) and unrecognized `plan_enter`/`plan_exit` permission keys
- handoff skill: removed ignored `invocation` frontmatter field; `/start` and `/end` gained description frontmatter; `/end` no longer assumes bash-only heredoc syntax

### Changed
- spec-writer no longer edits `docs/CHANGELOG.md` (changelog belongs to developers/docs-maintainer)
- Removed unused `@opencode-ai/plugin` dependency from `.opencode/` (no plugins exist); `.opencode/.gitignore` is now tracked (was self-ignored) so clones get ignore rules
- Makefile: removed duplicated legacy CI target block that overrode the updated one
- Docs synced: AGENTS.md skills/routing tables, CREATING_AGENTS.md (correct global agents path `~/.config/opencode/agent(s)/`, modern template without deprecated fields, bash wildcard rule), opencode-docs.md (agents/skills/schema verified 2026-08-25)

---

## [0.1.0] - [DATE]

### Added
- Proyecto inicial con harness de agentes SDD
- Agentes: architect, spec-writer, frontend-developer, backend-developer, code-reviewer, gdpr-auditor, release-manager, docs-auditor
- Hooks de seguridad en Claude Code
- Memoria agnostica compartida
- Makefile con comandos de agentes

---

_Registra cada release significativo. Manten la seccion [Unreleased] actualizada._
