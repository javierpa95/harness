# 🚀 SDD Agent Harness

**Development harness for AI-coordinated projects using Specification-Driven Development.**

Not just a list of agents — a **connected system** where the architect enforces specs, reviews, and docs before every commit.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **8 Agents** | Architect, spec-writer, frontend/backend developers, code-reviewer, docs-auditor, gdpr-auditor, release-manager |
| **6-Step SDD Flow** | Analyze → Spec → Implement → Review → Docs → Decide |
| **2 Platform Support** | Claude Code + OpenCode (same repo, both work) |
| **Shared Memory** | Agents remember across sessions and platforms |
| **Git Hooks** | Husky + commitlint (conventional commits) |
| **CI/CD** | Basic + Advanced pipelines (disabled by default) |
| **Design System** | DESIGN.md + 142 reference systems (Material, Apple, Shadcn...) |
| **Security Hooks** | Block dangerous commands, validate syntax |
| **30+ Make Commands** | Everything exposed via `make` |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/javierpa95/0.harnes.git my-project
cd my-project

# 2. Auto-configure
make init

# 3. Start developing
# Open in Claude Code or OpenCode — the architect guides you
```

### What `make init` does:

1. Asks for project name, description, type
2. Asks for stack (frontend, backend, database, deploy)
3. Asks for design system (Material, Apple, Shadcn, etc.)
4. Installs dependencies (husky, commitlint)
5. Configures git hooks
6. Fills placeholders in AGENTS.md, CLAUDE.md
7. Creates DESIGN.md and CODING_STANDARDS.md
8. Generates prompt.md for agent to finish setup

---

## The SDD Flow

```
1. ANALYZE  → Architect analyzes the request
2. SPEC     → Spec-writer creates/updates the spec
3. IMPLEMENT → Developers implement (TDD for backend)
4. REVIEW   → Code-reviewer verifies (2 axes: Standards + Spec)
5. DOCS     → Docs-auditor verifies documentation
6. DECIDE   → Architect: PASS (commit) or FAIL (iterate)
```

**Rule:** No commit without docs-auditor approval.

---

## Agents

| Agent | Role | When to use |
|-------|------|-------------|
| **architect** | SDD orchestrator, decides | Always — entry point |
| **spec-writer** | Writes feature specs | Before implementing |
| **frontend-developer** | Implements UI | If there's a frontend |
| **backend-developer** | Implements API/DB with TDD | If there's a backend |
| **code-reviewer** | Reviews in 2 axes (Standards + Spec) | After implementing |
| **docs-auditor** | Verifies docs are updated | **Always before commit** |
| **gdpr-auditor** | Security/privacy audit | If handling user data |
| **release-manager** | Versioning and releases | When preparing release |

### Code Review: 2 Axes

```
Axis 1: Standards — Does the code follow project conventions?
Axis 2: Spec — Does the code implement what the spec asked for?

Both run in parallel. Reports are separate.
```

---

## Platform Support

### Claude Code

- Architect lives in `CLAUDE.md` (system prompt)
- Subagents in `.claude/agents/`
- Hooks in `.claude/settings.json`
- Skills in `.claude/skills/`

### OpenCode

- Architect in `.opencode/agents/project-architect.md` (mode: primary)
- Agents in `.opencode/agents/`
- Rules in `.opencode/rules/`

**Both platforms share:** memory (`agent-memory/`), docs, Makefile, init.sh

---

## Commands

```bash
make help              # Show all commands
make init              # Auto-configure project
make check             # Lint + typecheck + test
make review            # Code review on last commit
make audit             # GDPR audit on staged changes
make agents            # List available agents
make memory            # Show agent memory status
make hooks             # Show active hooks
make ci-status         # Check CI pipeline status
make ci-enable-basic   # Enable basic CI
make design-lint       # Validate DESIGN.md
make design-ref        # Show reference design systems
```

---

## Project Structure

```
0.harnes/
├── .opencode/agents/          # OpenCode agents (7)
├── .claude/                   # Claude Code config
│   ├── agents/                # Subagents (6)
│   ├── commands/              # /start, /end
│   ├── skills/                # hooks-and-memory
│   └── settings.json          # Security hooks
├── agent-memory/              # Shared memory (agnostic)
├── docs/                      # Template documentation
├── .husky/                    # Git hooks
├── .github/workflows/         # CI/CD (disabled)
├── CLAUDE.md                  # Claude Code context
├── AGENTS.md                  # OpenCode context
├── CONTEXT.md                 # Domain glossary
├── DESIGN.md.template         # Visual design tokens
├── CODING_STANDARDS.md.template # Code conventions
├── ATTRIBUTION.md             # Sources and inspirations
├── Makefile                   # 30+ commands
└── init.sh                    # Auto-configuration
```

---

## Design System

```bash
# Validate DESIGN.md
make design-lint

# Export to Tailwind
make design-export-tailwind

# See reference systems (142+ available)
make design-ref
```

Reference systems: Material, Apple, Ant, Shadcn, Tailwind, Vercel, Linear, Notion, Spotify, Airbnb, BMW, Canva, Discord, GitHub, IBM, MongoDB, NVIDIA, OpenAI, Shopify, Stripe, Tesla, Uber...

Source: [Open Design](https://github.com/nexu-io/open-design) (80k+ ⭐)

---

## Git Hooks

**pre-commit:** Detects secrets, warns about console.log
**commit-msg:** Validates conventional commits

```bash
# Commit format
feat(auth): add user authentication
fix(api): handle null response
docs: update deployment guide
```

---

## CI/CD

Both pipelines are **disabled by default**:

```bash
make ci-status         # Check what's enabled
make ci-enable-basic   # Lint + test (fast)
make ci-enable-advanced # + security + coverage + Docker
make ci-disable        # Disable all
```

---

## Inspiration

| Pattern | Source |
|---------|--------|
| 2-axis code review | [Matt Pocock](https://github.com/mattpocock/skills) (180k ⭐) |
| Grilling mode | Matt Pocock |
| DESIGN.md tokens | [Google](https://github.com/google-labs-code/design.md) (26k ⭐) |
| Design system refs | [Open Design](https://github.com/nexu-io/open-design) (80k ⭐) |
| Conventional Commits | [Angular/Google](https://www.conventionalcommits.org/) |
| Husky + commitlint | [Typicode](https://typicode.github.io/husky/) |

See [ATTRIBUTION.md](ATTRIBUTION.md) for full documentation.

---

## What's Missing

See [HARNESS_SUMMARY.md](docs/development/HARNESS_SUMMARY.md) for prioritized improvement suggestions.

---

## License

MIT — use it for anything.
