# Git Workflow

## Principio

Adapta el workflow al tamano del equipo. Para un solo desarrollador, commits directos a `main` son aceptables. Para equipos, usa branches y PRs.

## Workflow (solo developer)

```
main ← unica rama, commits directos
```

## Workflow (equipo)

```
main ← siempre estable
  ↑
  ├── feature/xxx ← nuevas funcionalidades
  ├── fix/xxx     ← correcciones
  └── release/x.x ← preparacion de release
```

### Flujo diario

```bash
# 1. Hacer cambios
# 2. Ver que vas a commitear
git status

# 3. Commitear
git add .
git commit -m "feat: add new feature"

# 4. Verificar build
# (comando de build del proyecto)

# 5. Push
git push
```

## Commits

Formato: `type(scope): description`

| Type | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat: add user authentication` |
| `fix` | Bug fix | `fix: handle null response` |
| `docs` | Documentacion | `docs: update deployment guide` |
| `refactor` | Refactor sin cambio funcional | `refactor: extract utility function` |
| `chore` | Mantenimiento | `chore: update dependencies` |
| `security` | Seguridad | `security: add route protection` |

## Reglas

1. **Commits atomicos**: Un cambio = un commit. No mezcles features.
2. **Build antes de push**: Siempre verifica el build antes de pushear.
3. **No commitear secretos**: `.env`, datos locales, credenciales — NUNCA.
4. **main siempre funciona**: Si rompes algo, fix inmediato.

## Prohibiciones

- NO pushear a main con build roto
- NO commitear `.env` o datos locales
- NO usar `--no-verify` sin buena razon
- NO force push a main

## Tags (releases)

```bash
# Cuando lances algo significativo
git tag -a v0.1.0 -m "Initial release"
git push origin v0.1.0
```

Versionado: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: Nuevas features (backwards compatible)
- PATCH: Bug fixes
