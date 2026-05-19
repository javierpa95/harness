# Docs Maintainer Skill

## Description

Ensures documentation stays synchronized with code changes.

## Activation

Activated when code files in `apps/`, `services/`, or `src/` are modified.

## Rules

### Detect Documentation Impact

| Code Change | Documentation to Update |
|-------------|------------------------|
| Frontend (UI, pages, components) | Feature specs, architecture |
| Backend (API, DB, auth) | Architecture, data contracts |
| Config, deploy, CI/CD | Deployment docs |
| `.env.example` changes | Setup docs |

### CHANGELOG.md

Update for user-facing commits:
- `feat:` → Added
- `fix:` → Fixed
- `security:` → Security
- Breaking changes → Breaking Changes

### Verification Checklist

- [ ] User-facing change: CHANGELOG.md updated
- [ ] Architecture change: architecture doc updated
- [ ] New env var: `.env.example` updated

## Response Format

```
📝 Documentation Impact Detected

Changed files:
- <file path>

📋 Suggested updates:
1. docs/features/<feature>.md - Document changes
2. docs/CHANGELOG.md - Add entry

❓ Update docs now?
```
