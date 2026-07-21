# CLAUDE.md — SDD Agent Harness

**Project:** [PROJECT_NAME] — [ONE_LINE_DESCRIPTION]
**Stack:** [STACK_TECH]
**Version:** 0.1.0

This project uses a **Specification-Driven Development (SDD)** harness with AI agents coordinating the workflow.

---

## Quick Reference

### The SDD Cycle

```
1. ANALYZE  → Architect analyzes the request (or grills if plan is complex)
2. SPEC     → Spec Writer creates/updates the spec
3. IMPLEMENT → Developers implement (TDD for backend/utils)
4. REVIEW   → Code Reviewer verifies (2 axes: Standards + Spec)
5. DECIDE   → Architect: PASS (commit) or FAIL (iterate)
```

### Key Commands

| Command | What it does |
|---------|-------------|
| `/start` | Load full context at session start |
| `/end` | Persist learnings to session-log.md |
| `/grill` | Interview mode for complex plans |

### Agent Routing

| User says... | Use... |
|-------------|--------|
| "I want to implement X" | `project-architect` (SDD flow) |
| "I have an idea" / "What do you think?" | `project-architect` (grilling mode) |
| "Review this code" | `code-reviewer` |
| "What's left for release?" | `release-manager` |
| "Any security issues?" | `gdpr-auditor` |
| "Write the spec for X" | `spec-writer` |
| "Another agent needs to continue this" | `handoff` |

---

## Project Structure

```
apps/
  web/                    Frontend

services/
  backend/                Backend + DB

docs/
  architecture/           Technical decisions, diagrams
  features/               Feature specs (SDD)
  legal/                  Privacy, terms
  development/            Memory, session log, tech debt

config/
  .env.example            Environment variables

CONTEXT.md                Domain glossary (REQUIRED)
ATTRIBUTION.md            Sources and patterns documentation
```

---

## Core Rules

### SDD Flow (MANDATORY)

1. **Spec first**: No code without an approved spec in `docs/features/`
2. **TDD in backend/utils**: Tests before code. Each acceptance criteria = at least one test
3. **Review mandatory**: Every functional change goes through code-reviewer (2 axes)
4. **Docs mandatory**: Every functional change goes through docs-auditor before commit
5. **Parallel where possible**: Frontend + backend in parallel; review + GDPR audit in parallel
6. **Architect decides**: Only the architect can mark a task as done

### TDD Cycle (Red → Green → Refactor)

```
1. RED     → Write the failing test
2. GREEN   → Write minimum code to pass
3. REFACTOR → Improve code without breaking tests
4. REPEAT  → Next acceptance criteria
```

### Exceptions

| Case | Flow |
|------|------|
| Trivial change (text, color) | Analyze → Implement → Decide (skip spec + review) |
| Bug fix without behavior change | Analyze → Implement → Decide |
| Bug fix with behavior change | Full flow (spec + tests mandatory) |
| Sensitive data | Review + GDPR audit in parallel |

---

## Conventions

### Code Style

- **Components**: PascalCase
- **Pages/Routes**: kebab-case
- **Utils/Services**: camelCase
- **Collections/Tables**: plural, English (`users`, `products`)
- **Fields**: snake_case (`created_at`, `user_id`)
- **Migrations**: timestamp_description
- **Endpoints**: kebab-case (`/api/user-profile`)
- **Test files**: `*.test.ext`

### Commits

Conventional Commits: `type(scope): description`

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Refactor without behavior change |
| `chore` | Maintenance |
| `security` | Security fix |

### Security (NEVER)

- Never hardcode credentials, passwords, tokens
- Never commit `.env`, `node_modules`, or local data directories
- Always use environment variables for sensitive config
- Always validate inputs on endpoints and forms
- Always protect admin routes with authentication

---

## Skills Available

| Skill | When to use | File |
|-------|-------------|------|
| `handoff` | Transfer context to another agent | `.claude/skills/handoff/SKILL.md` |

### Skill Invocation

Skills are invoked by name. When the context matches a skill's description, invoke it:

```
Use the handoff skill to transfer this session's context
```

---

## Authority Hierarchy

1. `AGENTS.md` — Supreme project conventions
2. `CONTEXT.md` — Domain glossary and shared vocabulary
3. `docs/architecture/system_overview.md` — Architectural map
4. `docs/features/*.md` — Feature specifications
5. `.claude/rules/*.md` — Technical laws by domain

---

## Session Start Ritual

Before responding to any technical request, read:

1. `AGENTS.md` — Conventions and prohibitions
2. `CONTEXT.md` — Domain glossary
3. `docs/development/session-log.md` — Last 3 entries
4. `docs/development/agent_memory.md` — Last 2 findings
5. `docs/architecture/system_overview.md` — General architecture

If the user ran `/start`, this context is already loaded. Confirm it.

---

## Code Review (2 Axes)

The code-reviewer runs two parallel sub-agents:

1. **Standards** — Does the code follow documented coding standards?
2. **Spec** — Does the code implement what the spec asked for?

Both reports are presented side-by-side, never merged.

### Baseline Code Smells (always apply)

- Mysterious Name
- Duplicated Code
- Feature Envy
- Data Clumps
- Primitive Obsession
- Repeated Switches
- Shotgun Surgery
- Divergent Change
- Speculative Generality
- Message Chains
- Middle Man
- Refused Bequest

---

## Prohibitions (NEVER)

1. Never skip the SDD flow
2. Never implement without a spec
3. Never commit without review (except trivial changes)
4. Never assume code behavior — read it
5. Never propose changes that violate AGENTS.md prohibitions

---

_This document evolves with the project. If something is unclear, ask._
