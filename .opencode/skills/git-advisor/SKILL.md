---
name: git-advisor
description: Use when about to commit, push, or otherwise perform a git operation. Confirms commit format, branch workflow (solo vs team), and runs the pre-push checklist (build, no secrets, no .env).
---

# Git Advisor

Guides git operations. Adapts to solo developer or team workflow.

## When to use

Call this skill when the user mentions git operations, commits, or pushing — it is not automatic, the agent decides to invoke it based on the description above.

## Rules

### Workflow

Solo developer → direct commits to `main`.
Team → branches (`feature/`, `fix/`) and PRs.

```bash
git add .
git commit -m "feat: add new feature"
git push
```

### Commit Format

`type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `security`

### Pre-Push Checklist

- [ ] Build passes
- [ ] No secrets staged: `git grep -iE "password|secret" --cached`
- [ ] No `.env` or local data in staging

### Prohibitions

- NEVER push with broken build
- NEVER commit `.env` or local data
- NEVER force push to main
