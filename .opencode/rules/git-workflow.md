# Git Workflow

## Principio

Adapta el workflow al tamaño del equipo. Para un solo desarrollador, commits directos a `main` son aceptables. Para equipos, usa branches y PRs.

## Workflow (solo developer)

```
main ← única rama, commits directos
```

## Workflow (equipo)

```
main ← siempre estable
  ↑
  ├── feature/xxx ← nuevas funcionalidades
  ├── fix/xxx     ← correcciones
  └── release/x.x ← preparación de release
```

## Commits — Conventional Commits

Formato: `type(scope): description`

### Tipos

| Type | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat: add user authentication` |
| `fix` | Bug fix | `fix: handle null response` |
| `docs` | Documentación | `docs: update deployment guide` |
| `style` | Formateo (sin cambio de código) | `style: fix indentation` |
| `refactor` | Refactor sin cambio funcional | `refactor: extract utility function` |
| `perf` | Mejora de rendimiento | `perf: optimize database queries` |
| `test` | Tests | `test: add unit tests for auth` |
| `build` | Sistema de build | `build: update webpack config` |
| `ci` | Configuración de CI | `ci: add GitHub Actions workflow` |
| `chore` | Mantenimiento | `chore: update dependencies` |
| `revert` | Revert commit | `revert: undo changes in v0.1.0` |
| `security` | Fix de seguridad | `security: add rate limiting` |

### Scope (opcional)

El scope va entre paréntesis y indica qué área del código afecta:

```
feat(auth): add login page
fix(api): handle null response
docs(readme): update installation guide
chore(deps): update dependencies
```

Scopes comunes:
- `auth`, `api`, `ui`, `db`, `deps`, `config`, `ci`, `docs`

### Reglas de mensajes

1. **Minúsculas**: Todo en minúsculas después de `type(scope):`
2. **Sin punto final**: No terminar con `.`
3. **Máximo 100 caracteres**: En la primera línea
4. **Imperativo**: "add feature" no "added feature"
5. **Atomico**: Un cambio = un commit

### Ejemplos

```bash
# ✅ Bien
feat(auth): add JWT authentication
fix(api): handle empty product list
docs: update README with install steps
chore(deps): update npm packages

# ❌ Mal
Added new feature          # sin type
Feat: Add Feature          # mayúsculas
fix: fixed bug.            # punto final
feat(auth): Added login    # pasado, no imperativo
```

## Git Hooks (Husky)

El proyecto usa Husky para ejecutar hooks automáticos:

### pre-commit

Ejecuta automáticamente antes de cada commit:
- Verifica que no haya secrets hardcodeados
- Advierte si hay `console.log` en código de producción

### commit-msg

Valida el formato del mensaje de commit contra Conventional Commits:
- Rechaza mensajes que no sigan el patrón `type(scope): description`
- Muestra ejemplos de formato correcto

### Instalar hooks

```bash
npm install  # instala husky + commitlint
```

### Validar commit manualmente

```bash
npx commitlint --edit  # valida el último commit message
```

## Flujo diario

```bash
# 1. Hacer cambios
# 2. Ver que vas a commitear
git status

# 3. Commitear (formato válido requerido)
git add .
git commit -m "feat: add new feature"

# 4. Verificar build
make check

# 5. Push
git push
```

## Reglas

1. **Commits atómicos**: Un cambio = un commit. No mezcles features.
2. **Build antes de push**: Siempre verifica el build antes de pushear (`make check`).
3. **No commitear secretos**: `.env`, datos locales, credenciales — NUNCA.
4. **main siempre funciona**: Si rompes algo, fix inmediato.
5. **Documentación actualizada**: Si tocas código, actualiza docs (`make review`).
6. **Sin force push a main**: Nunca fuerces a la rama principal.

## Prohibiciones

- NO pushear a main con build roto
- NO commitear `.env` o datos locales
- NO usar `--no-verify` sin buena razón
- NO force push a main
- NO commitear sin conventional commit format

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

## Herramientas

| Herramienta | Para qué | Comando |
|-------------|----------|---------|
| Husky | Git hooks | `npm install` |
| commitlint | Validar mensajes | `npx commitlint --edit` |
| Make | Comandos del proyecto | `make help` |

---

_Este documento evoluciona con el proyecto. Si algo no está claro, pregunta._
