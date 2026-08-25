# Changelog

Todos los cambios notables en este proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- `harness-arquitect` primary agent (OpenCode-only): meta-agent that configures and evolves the harness itself; full edit/bash permissions with `.env*` still denied
- `docs/harness/opencode-docs.md`: verified knowledge base of official OpenCode docs (permissions first), maintained by harness-arquitect
- MCP integration: codegraph, context7, engram servers pre-configured and enabled in `.opencode/opencode.jsonc` and `.claude/settings.json`
- `docs/harness/` educational doc directory with: MCP-integration.md, agents-patterns.md, sdd-advanced.md
- Agent tool patterns: CodeGraph, Context7, Engram integration with SDD flow

### Fixed
- MCP servers: fix npm 404 packages. CodeGraph now uses `@astudioplus/codegraph-mcp`; Engram uses the native local binary `engram mcp --tools=agent` (no longer the nonexistent `@gentlest-mcp/*`). All three MCPs (codegraph, context7, engram) now active by default for an out-of-the-box harness in both `.opencode/opencode.jsonc` and `.claude/settings.json`.
- Permission rule ordering in all granular agents: catch-all (`'*'`) now comes FIRST, specific rules AFTER ("last matching rule wins" per official docs); previous ordering silently denied whitelisted commands

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
