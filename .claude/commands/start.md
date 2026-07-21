# /start — Load Project Context

Load the full project context at the beginning of a session.

## Steps

1. Read `AGENTS.md` — conventions and prohibitions
2. Read `CONTEXT.md` — domain glossary
3. Read `docs/development/session-log.md` — last 3 entries
4. Read `docs/development/agent_memory.md` — last 2 findings
5. Read `docs/architecture/system_overview.md` — general architecture
6. Check `git status` — current branch and recent changes
7. Confirm to user: "Context loaded. Project: [name]. Branch: [branch]. Ready."

## Output

```
✅ Context Loaded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: [name]
Stack: [tech]
Branch: [branch]
Last 3 commits:
- [commit 1]
- [commit 2]
- [commit 3]

Active specs:
- [spec 1] — [status]
- [spec 2] — [status]

Ready to work. What do you need?
```
