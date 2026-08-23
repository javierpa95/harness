# 07 · Mantenimiento del harness

> **Qué sabés después de leer esto:** cómo mantener el harness sano cuando las cosas no andan — validar config, arrancar con un config roto, limpiar duplicados, y el escape hatch definitivo.

---

## Regla #0: validar antes de tocar

opencode **rechaza `opencode.json` inválido y no arranca**. Antes de dar algo por bueno:

1. **JSON válido**: `ConvertFrom-Json` o algún validador.
2. **Claves conocidas**: contrastá contra el schema `https://opencode.ai/config.json`.
3. **Frontmatter de agentes/skills**: `name`, `description`, mode correctos.

## Escape hatches (config rota y no arranca)

Si rompiste un config y opencode no levanta:

```bash
# Arranca ignorando el config del proyecto (solo global)
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode

# Cargar un config alternativo explícito
OPENCODE_CONFIG=/path/to/otra-config.json opencode

# Desactivar plugins externos
OPENCODE_PURE=1 opencode
```

Con `OPENCODE_DISABLE_PROJECT_CONFIG=1` abrís, corregís el archivo, y volvés a abrir normal.

## Limpieza de duplicados

Este proyecto tuvo un duplicado real: `opencode.json` + `opencode.jsonc` con el mismo contenido. Eso confunde el merge y puede doble-cargar config.

**Regla:** mantené **UN solo** archivo de config de proyecto. Elegí `.json` (más universal con el schema) y borrá el `.jsonc` sobrante.

```bash
# ver si hay duplicados de config
git ls-files | Select-String 'opencode\.jsonc?$'
```

## Verificaciones rápidas de sanidad

```bash
# 1. Listar agentes y su mode/model
Get-Content .opencode/agents/*.md | Select-String '^(name|mode|model):'

# 2. Validar el opencode.json
ConvertFrom-Json < .opencode/opencode.json

# 3. Ver qué models tenés disponibles
opencode models

# 4. Estado del repo (historias limpias)
git log --oneline -10
```

## Checklist antes de commitear cambios al harness

- [ ] ¿Validé el JSON/JSONC contra el schema?
- [ ] ¿El frontmatter de agentes/skills es válido?
- [ ] ¿Documenté el cambio (CHANGELOG + onboarding si aplica)?
- [ ] ¿Los permisos no rompen el flujo (mínimo privilegio)?
- [ ] ¿Avise a reiniciar opencode?

## Mapa de referencia rápida

| Si tocás... | Recordá actualizar... |
|-------------|-----------------------|
| Config / permisos / MCP | `.opencode/opencode.json`, este manual (cap 4, 6) |
| Agentes | `.opencode/agents/*.md`, este manual (cap 5) |
| Skills | `.opencode/skills/*/SKILL.md` |
| Estructura del harness | `AGENTS.md`, `docs/architecture/system_overview.md` |
| Setup | `scripts/setup.ps1`, cap 04 |

---
*¿Un incidente de config al que le costaste? Documentá la causa acá para no repetirla.*