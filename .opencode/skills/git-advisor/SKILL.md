# Git Advisor

## Description

Guides git operations. Adapts to solo developer or team workflow.

## Activation

Activated when the user mentions git operations, commits, or pushing.

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
