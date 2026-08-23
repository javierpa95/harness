# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Project initialization from SDD Agent Harness template
- Pi SDD harness (`.pi/`): pi-subagents v0.42.1 installed, 7 custom `sdd-*` agents, and the `sdd-orchestrator` extension enforcing the SDD workflow (ANALYZE → SPEC → IMPLEMENT → REVIEW → DECIDE) — complementary to the opencode harness (`.opencode/`)
- Onboarding manual (`docs/onboarding/`): index + chapters 01 (concepts), 02 (SDD flow), 03 (harness in practice) — level-zero progressive disclosure book that grows with the project
- Onboarding advanced chapters: 05 (creating/editing agents), 06 (MCP servers + config merge), 07 (harness maintenance/testing, escape hatches)
- `make setup` harness configurator: interactive full-screen TUI (arrow keys, Enter to assign, Q/ESC to quit) that pre-loads existing picks; `make setup-file` applies a central `harness.settings.jsonc` non-interactively; detects the user's installed providers via `opencode models`; chapter 04 of onboarding documents it
