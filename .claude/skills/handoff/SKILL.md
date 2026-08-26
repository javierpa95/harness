---
name: handoff
description: "Compact the current conversation into a handoff document so another agent can continue the work. Use when the user says 'handoff', 'transfer context', or 'another agent needs to continue'."
disable-model-invocation: true
---

# Handoff — Transfer Context

Compact the current conversation into a handoff document for another agent to pick up.

## When to use

- When you need another agent to continue a task mid-work
- At the end of a long session to preserve context
- When switching between agents (e.g., architect to developer)

## Process

1. **Read the current state** — Check git status, open files, recent commits
2. **Summarize the session** — What was done, what's pending, what decisions were made
3. **Identify key files** — What files were modified, what specs are active
4. **Suggest next steps** — What the next agent should do first
5. **Save the document** — Write to the OS temp directory (not the workspace)

## Handoff Document Format

```markdown
# Handoff — [Date]

## Project
- Name: [name]
- Stack: [technologies]
- Status: [summary]

## Session Work
1. [What was done]
2. [What's pending]
3. [Decisions made]

## Key Files
- `path/to/file` — [what it does, what changed]

## Active Specs
- `docs/features/feature-a.md` — status: [draft/approved/in-progress/done]

## For the Next Agent
- Read first: `AGENTS.md`, `CONTEXT.md`
- Suggested skills: [list]
- Watch out for: [fragile areas, known bugs]
```

## Rules

1. **Redact secrets** — Never include API keys, passwords, tokens
2. **Reference by path** — Don't duplicate content from specs, ADRs, or commits
3. **Be concise** — The document is for context transfer, not storytelling
4. **Save to temp directory** — Use the OS temp directory, not the workspace
