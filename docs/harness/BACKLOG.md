# BACKLOG — Evolución del Harness

Ideas y mejoras pendientes para el template SDD. Mantenido por `harness-arquitect`.
Prioridad propuesta: 🔥 alto | 🧊 medio | ❄️ algún día

---

## TUI / Dashboard (`make tui` — v1: flechas, vistas, status bar)

### Caminos de evolución (opciones valoradas 2026-08-25)

| Opción | Qué aporta | Coste | Cuándo |
|--------|-----------|-------|--------|
| **Node raw actual** (elegida) | Cero deps, viaja en clones sin npm install, ANSI + keypress | Render manual, sin layout complejo | Ahora |
| `@clack/prompts` | Select/multiselect/spinners preciosos para wizards | Dep nueva en `.opencode/` (+ reinstalar package.json) | Si los flujos se vuelven formularios largos |
| **Ink (React CLI)** | Dashboard real: paneles, tablas vivas, focus por panel | react+ink, build mental React, deps pesadas | Cuando haya ≥4 paneles vivos o refresco en tiempo real |
| Web dashboard local | UI total, gráficos, histórico | Servidor + abrir navegador; sale del flujo de terminal | ❄️ algún día |
| Plugin OpenCode con hooks | Eventos en vivo del harness (tool calls, permisos denegados) | Aprender API plugins; reinstalar deps `.opencode/` | Cuando queramos auditiva EN VIVO |

### Items concretos

- [ ] 🔥 Wizard de modelos con lista de modelos recientes/sugeridos (no tener que teclear el ID)
- [ ] 🧊 Vista "auditoría": permisos efectivos por agente (merge global+agente) renderizados
- [ ] 🧊 Toggle on/off de agentes por stack (equivalente visual a borrar el .md, reversible)
- [ ] 🧊 Editor de permisos por agente (whitelist de rutas editables) con preview del diff
- [ ] 🧊 Gestor de MCP servers (enable/disable sin editar jsonc a mano)
- [ ] ❄️ Modo "doctor": valida JSONC + frontmatter + rutas referenciadas en un solo pase
- [ ] ❄️ Refresco automático de la barra de estado (fs.watch sobre .opencode/)
- [ ] ❄️ Colores detectados (degradar a monocromo si la terminal no soporta ANSI)

## Modelos

- [x] Dashboard v1: navegación con flechas, cambio de modelo y herencia desde el propio TUI (2026-08-25)
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
- [x] ~~TUI v0 no interactiva a través de make (readline + stdin no-TTY)~~ → dashboard v1 con guard TTY y raw keys (2026-08-25)

---

_Regla: cada ítem al implementarse se marca [x] con fecha y su cambio se documenta en docs/CHANGELOG.md._
