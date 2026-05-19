# Post-Coding Check Skill

## Description

Quick verification after coding sessions. Keep it fast.

## When to Use

- After finishing a feature or bugfix
- Before committing

## Quick Check (< 1 minute)

Run the build command for your project.

```bash
# Examples:
npm run build
# or
python -m pytest
# or
cargo build
```

That's it. If build passes, you're good.

## Full Check (optional, before release)

```bash
npm run build
npm run typecheck  # if applicable
npm run lint       # if applicable
git grep -iE "password|secret" --cached
```

## Success Criteria

- [ ] Build exits 0
- [ ] No credentials in staged files

## Notes

- Do NOT commit if build fails
- Warnings are OK
- Speed matters more than perfection
