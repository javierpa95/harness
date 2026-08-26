# /end — Persist Session Learnings

Persist what was learned in this session to the development memory files.

## Steps

1. Summarize what was done in this session
2. Identify any new patterns, pitfalls, or decisions
3. Update `docs/development/session-log.md` with a new entry
4. Update `docs/development/agent_memory.md` with any new learnings
5. If specs were modified, ensure `docs/features/` is up to date
6. Commit all documentation changes

## Session Log Entry Format

```markdown
## [DATE] — Session Summary

### What was done
- [task 1]
- [task 2]

### Decisions made
- [decision 1]: [rationale]
- [decision 2]: [rationale]

### Learnings
- [learning 1]
- [learning 2]

### Next steps
- [next step 1]
- [next step 2]
```

## Agent Memory Entry Format

```markdown
## [DATE] — [Topic]

### Finding
[What was discovered]

### Implication
[What this means for the project]

### Action
[What should be done about it]
```
