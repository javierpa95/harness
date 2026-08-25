# OpenCode Docs — Base de Conocimiento del Harness

Notas **verificadas** contra la documentacion oficial de OpenCode. Este archivo es la memoria tecnica compartida: aqui se registra lo aprendido para no volver a dudarlo.

> **Regla de oro** (mantenida por `harness-arquitect`): cada nota lleva URL fuente + fecha de verificacion. Si algo no cuadra con la doc actual, reverificar y actualizar la nota.

Indice de la doc oficial: https://opencode.ai/docs/es

---

## Permisos

**Verificado:** 2026-08-25 — https://opencode.ai/docs/es/permissions/

### Niveles

Cada regla resuelve a una de:

| Valor | Efecto |
|-------|--------|
| `"allow"` | Ejecuta sin aprobacion |
| `"ask"` | Pide aprobacion al usuario |
| `"deny"` | Bloquea la accion |

### Semantica clave

- **La ULTIMA regla coincidente gana.** Patron correcto: regla general `"*"` PRIMERO, reglas especificas DESPUES.
  - ⚠️ Hallazgo 2026-08-25: todos los agentes del template tenian el orden invertido (allows primero, `'*': 'deny'` al final) → el deny anulaba las whitelist. Corregido en los 7 agentes granulares. Ver tambien `docs/development/CREATING_AGENTS.md`.
- Comodines: `*` = cero o mas caracteres, `?` = exactamente uno. El resto literal.
- Tip: `"grep *"` permite `grep patron archivo.txt`; `"grep"` a secas solo coincide con el comando sin argumentos. Comandos como `git status` con argumentos necesitan `"git status *"`.
- `~` o `$HOME` al inicio de un patron se expanden al directorio home (util para `external_directory`).
- Desde v1.1.1 la config booleana `tools` esta obsoleta y fusionada en `permission` (sigue soportada por compatibilidad).

### Lista completa de permisos

`read`, `edit` (cubre edit/write/patch), `glob`, `grep`, `bash`, `task` (subagentes), `skill`, `lsp`, `webfetch`, `websearch`, `external_directory`, `doom_loop` (misma llamada repetida 3 veces con entrada identica).

### Defaults

- Mayoria: `"allow"`.
- `doom_loop` y `external_directory`: `"ask"`.
- `read`: allow, pero `*.env` y `*.env.*` denegados (`*.env.example` permitido).

### La UI de "ask"

Al pedir aprobacion hay tres respuestas: `once` (solo esta vez), `always` (aprueba patrones sugeridos el resto de la sesion), `reject`.

### Overrides por agente

- En JSON: `"agent": { "<name>": { "permission": {...} } }`.
- En Markdown de agente: frontmatter `permission:` — **los permisos del agente se combinan con los globales y tienen prioridad**.
- Implicacion para este harness: el deny global de `edit` en `.opencode/**/*` NO bloquea a los agentes primary que declaran `edit: allow` (project-architect, harness-arquitect). La red global queda como seguro para subagentes de productos clonados.

### external_directory

Controla tools que tocan rutas fuera del directorio de trabajo. Un directorio permitido hereda los defaults del workspace; para bloquear ediciones ahi dentro manteniendo lecturas, anadir regla explicita de `edit` sobre esas rutas.

---

## Paginas pendientes de revisar

- https://opencode.ai/docs/es/agents/ — modos primary/subagent, model, temperature
- https://opencode.ai/docs/es/rules/ — reglas globales vs por-agente
- https://opencode.ai/docs/es/skills/ — formato SKILL.md, invocacion
- https://opencode.ai/docs/es/commands/ — comandos personalizados
- https://opencode.ai/docs/es/plugins/ — eventos, hooks equivalentes
- https://opencode.ai/docs/es/config/ — schema completo de opencode.jsonc

_Cuando se revise una pagina, moverla de esta lista a su seccion con notas + fecha._

---

_Este archivo lo mantiene `harness-arquitect`. Ultima actualizacion: 2026-08-25._
