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

## Agentes

**Verificado:** 2026-08-25 — https://opencode.ai/docs/es/agents/ + schema https://opencode.ai/config.json

### Frontmatter valido de agente (.md)

Campos reconocidos (el resto va a `options` silenciosamente): `name, model, variant, description, mode, hidden, color, steps, options, permission, disable, temperature, top_p`. El cuerpo del markdown es el `prompt` del agente.

- `mode`: `primary` | `subagent` | `all` (default `all`).
- `model`: formato `provider/model-id`. Sin el, los subagentes heredan el modelo del primary que los invoca y los primary el global.
- **`tools` esta DEPRECADO desde v1.1.1** (fusionado en `permission`); sigue funcionando por compatibilidad pero no usar en agentes nuevos.
- `default_agent` debe apuntar a un agente `primary` no oculto. **Si es invalido o no existe, OpenCode hace fallback SILENCIOSO a `build`** — por eso init.sh debe reescribirlo al renombrar el arquitecto.
- `description` es obligatoria en la practica: sin ella OpenCode no sabe cuando delegar.
- Permisos por-agente: se combinan con los globales y tienen prioridad (ver Permisos).
- `permission.task` controla que subagentes puede invocar un agente via Task tool (glob patterns; deny lo elimina de la descripcion de la herramienta).

### Claves muertas detectadas en auditoria

`plan_enter` / `plan_exit` NO son permisos reconocidos (hereda de versiones antiguas). El schema los tolera (`additionalProperties`) pero no hacen nada. Eliminados de project-architect el 2026-08-25.

---

## Skills

**Verificado:** 2026-08-25 — https://opencode.ai/docs/es/skills/

- Frontmatter reconocido SOLO: `name`, `description` (ambos obligatorios), `license`, `compatibility`, `metadata` (mapa string-string). **Los campos desconocidos se IGNORAN** (ej: `invocation:` era config muerta en handoff).
- `name`: regex `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-64 chars, debe coincidir con el nombre de la carpeta.
- `description`: 1-1024 chars; cubre QUE hace y CUANDO usarla; tercera persona ("Use when...").
- Ubicaciones escaneadas: `.opencode/skills/<name>/SKILL.md`, `~/.config/opencode/skills/`, mas compatibilidad `.claude/skills/` y `.agents/skills/`.
- Permisos: `permission.skill` con patrones glob (`deny` oculta la skill al agente).

---

## Config schema (opencode.jsonc)

**Verificado:** 2026-08-25 — https://opencode.ai/config.json

- Raiz con `additionalProperties: false`: una clave desconocida en la raiz ROMPE el arranque (ConfigInvalidError). Declarar `$schema` ayuda al editor.
- JSONC soportado oficialmente (`allowComments: true`, trailing commas ok).
- `permission.*` acepta string plano o objeto `{patron: accion}`; claves conocidas: read/edit/glob/grep/list/bash/task/skill/lsp/webfetch/websearch/external_directory/doom_loop/todowrite/question (algunas solo aceptan accion plana).
- MCP local: `command` array obligatorio; remote: `url` obligatorio; ambos admiten `enabled`.

---

## Paginas pendientes de revisar

- https://opencode.ai/docs/es/rules/ — reglas globales vs por-agente
- https://opencode.ai/docs/es/commands/ — comandos personalizados
- https://opencode.ai/docs/es/plugins/ — eventos, hooks equivalentes

_Cuando se revise una pagina, moverla de esta lista a su seccion con notas + fecha._

---

_Este archivo lo mantiene `harness-arquitect`. Ultima actualizacion: 2026-08-25._
