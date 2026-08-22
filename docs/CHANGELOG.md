# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Project initialization from SDD Agent Harness template
- Pi SDD harness (`.pi/`): pi-subagents v0.42.1 installed, 7 custom `sdd-*` agents, and the `sdd-orchestrator` extension enforcing the SDD workflow (ANALYZE → SPEC → IMPLEMENT → REVIEW → DECIDE) — complementary to the opencode harness (`.opencode/`)
- Onboarding manual (`docs/onboarding/`): index + chapters 01 (concepts), 02 (SDD flow), 03 (harness in practice) — level-zero progressive disclosure book that grows with the project
