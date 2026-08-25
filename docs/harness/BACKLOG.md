# BACKLOG — Evolución del Harness

Ideas y mejoras pendientes para el template SDD. Mantenido por `harness-arquitect`.
Prioridad propuesta: 🔥 alto | 🧊 medio | ❄️ algún día

---

## TUI (`make tui` — v0 ya funcional)

- [ ] 🔥 Wizard de modelos con lista de modelos recientes/sugeridos (no tener que teclear el ID)
- [ ] 🧊 Toggle on/off de agentes por stack (equivalente visual a borrar el .md, reversible)
- [ ] 🧊 Editor de permisos por agente (whitelist de rutas editables) con preview del diff
- [ ] 🧊 Gestor de MCP servers (enable/disable sin editar jsonc a mano)
- [ ] ❄️ Modo "doctor": valida JSONC + frontmatter + rutas referenciadas en un solo pase
- [ ] ❄️ Colores/tema en consola (chalk-free: códigos ANSI directos)

## Modelos

- [ ] 🧊 `make models --json` para consumo por otros scripts
- [ ] ❄️ Perfil de modelos por entorno (ej: baratos para auditors, top para architect)

## Seguridad

- [ ] 🔥 Documentar/mitigar el gap conocido: agentes con `bash` pueden leer `.env` vía shell
      aunque `read` lo deniegue (limitación genérica del modelo de permisos, no específica
      de este harness). Opciones: hooks de plugin que inspeccionen comandos bash.
- [ ] 🧊 Skill `security-guard`: añadir patrón de detección de URLs internas con credenciales

## Docs / Onboarding

- [ ] 🧊 `docs/harness/opencode-docs.md`: revisar páginas pendientes (rules/, commands/, plugins/)
- [ ] ❄️ Video/gif del flujo SDD completo para README

## Limpieza técnica conocida

- [x] ~~init.sh no actualizaba default_agent~~ (2026-08-25)
- [x] ~~Permisos de memoria escribible + wildcards bash en agentes~~ (2026-08-25)
- [x] ~~Bloques CI duplicados en Makefile~~ (2026-08-25)

---

_Regla: cada ítem al implementarse se marca [x] con fecha y su cambio se documenta en docs/CHANGELOG.md._
