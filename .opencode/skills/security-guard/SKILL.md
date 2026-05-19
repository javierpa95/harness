# Security Guard Skill

## Description

Scans for credentials and security anti-patterns before commits.

## Activation

Before commits or when security-sensitive files are modified.

## Rules

### Credential Detection

Patterns: `password=`, `secret=`, `api_key=`, `token=`, `https://user:pass@`

### Anti-Patterns

| Pattern | Fix |
|---------|-----|
| `process.env.VAR \|\| "real-value"` | Make env vars mandatory |
| `console.log(userData)` | Use redacted IDs |
| No input validation | Validate size/type |

### Pre-Commit Checklist

- [ ] No credentials: `git grep -iE "password|secret|token" --cached`
- [ ] No personal data in logs
- [ ] Env vars mandatory (no real fallbacks)
- [ ] Protected routes require auth

## Response Format

```
🔒 Security Scan Results

✅ Passed: No credentials detected
⚠️ Warnings: console.log in file.ts:42
🔴 Critical: Protected route missing auth check
```
