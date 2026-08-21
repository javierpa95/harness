# Agent memory

This directory stores persistent role memory for pi-subagents custom agents
that opt in via `memory: { scope: "project", path: "<role>" }` frontmatter
(e.g. sdd-spec-writer, sdd-code-reviewer, sdd-gdpr-auditor).

Files are written at runtime by the agents; this directory is gitignored.
