---
name: security-guard
description: Use before a commit that touches auth, env config, or logging, or whenever security-sensitive files were modified. Scans for hardcoded credentials, unsafe env fallbacks, and missing auth checks.
---

# Security Guard Skill

Scans for credentials and security anti-patterns before commits.

## When to use

Call this skill before commits, or when security-sensitive files are modified — it is not automatic, the agent decides to invoke it based on the description above.

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
