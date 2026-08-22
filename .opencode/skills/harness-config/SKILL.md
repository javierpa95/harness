---
name: harness-config
description: Use when Editing or creating opencode harness configuration - opencode.json, MCP servers, permission rules, agents, skills, commands, or plugins under .opencode/. Also use when adding MCP (codegraph, context7, engram), adjusting agent permissions, creating subagents, or troubleshooting config load order. Do NOT use for the project's own application code.
---

# OpenCode Harness Configuration

Guía para tocar con seguridad la infraestructura de agentes de opencode (`.opencode/`). Cada cambio aquí afecta a todos los flujos del proyecto.

## Reglas de oro

1. **El config se valida estricto**: opencode rechaza `opencode.json` inválido y no arranca. Valida contra `https://opencode.ai/config.json` antes de asumir que un campo existe.
2. **No hay hot-reload**: el config se carga al arrancar. Tras cualquier cambio, avisa al usuario de **reiniciar opencode**.
3. **Fusi�n (merge) de configs**, no reemplazo. Orden de precedencia (sobrescribe el anterior):
   remote → global (`~/.config/opencode/opencode.json`) → custom (`OPENCODE_CONFIG`) → proyecto (`opencode.json` en raíz / buscado subiendo hasta el git root) → `.opencode/` (agents, commands, plugins) → inline (`OPENCODE_CONFIG_CONTENT`).
4. **No uses `tools:`** en agentes: deprecado desde v1.1.1, fusionado en `permission`.

## Permisos

- Cada regla resuelve a `"allow"` (sin aprobar), `"ask"` (pide conf = confirm), `"deny"` (bloquea).
- Claves disponibles (ama rights): `read, edit (cubre write/edit/patch), glob, grep, list, bash, task, skill, lsp, question, webfetch, websearch, external_directory, doom_loop, todowrite`.
- `read, edit, glob, grep, list, bash, task, external_directory, lsp, skill`: aceptan shoraction (`"allow"`) u **objecto por patrón**.
- `question, webfetch, websearch, doom_loop, todowrite`: solo acción plana.
- **Patrones granulares**: reglas de objecto se evalúan con **la ÚLTIMA que matchea gana**. Pon `"*"` al inicio y las específicas después.

```json
"permission": {
  "edit": { "*": "deny", ".opencode/**/*": "allow" },
  "bash": { "*": "ask", "git status*": "allow" }
}
```

- Patrones usan wildcards: `*` (0+ chars), `?` (1 char). `~`/`$HOME` expanden home.
- **external_directory**: para rutas fuera del working dir. Heredan los defaults del workspace.
- **Los permisos de agente PRIMan sobre el config global**. La prohibición del proyecto sobre `.opencode/**/*` puede romper el trabajo del harness-architect; para permitir sulfamente, declara la regla específica en el FRONTMATTER del agente (ej `edit: { "**": "allow" }`, no `edit: allow`).

## MCP servers

En `.opencode/opencode.json` bajo la clave `mcp`, objeto por nombre, discriminado por `type`:

```json
"mcp": {
  "codegraph": { "type": "local", "command": ["codegraph", "serve", "--mcp"], "enabled": true },
  "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp", "enabled": true },
  "engram": { "type": "local", "command": ["engram", "mcp", "--tools=agent"], "enabled": true }
}
```

- `type` es `"local"` (con `command` array de strings) o `"remote"` (con `url` y `headers` opcional).
- Prefiere **nombre de binario portable** (`"engram"`) sobre rutas locales absolutas si el binario está en PATH — así el template se puede copiar a otra máquina.
- Para desactivar un server heredado de otro config: `"nombre": { "enabled": false }`.

## Archivo de agente

El archivo en `.opencode/agents/<name>.md` da: frontmatter + body (el body es el `prompt`).

Campos frontmatter válidos: `name, model, variant, description, mode, hidden, color, steps, options, permission, disable, temperature, top_p`. Otros se routing a `options`.

- `mode`: `primary` (agente principal, Tab), `subagent` (invokable por agentes vía Task o @), `all`.
- Permisos por agente pueden ir como object por keys (`bash: { "*": "ask", "git *": "allow" }`).
- `task` (permissions del agente) controla qué subagentes puede lanzar vía Task, con globs; orden de evaluación `*` primero.

## Skills

Skill loader escanea `**/SKILL.md` dentro de dirskills. El directorio de skill se llama como la skill; el archivo es `SKILL.md` exacto.

```markdown
---
name: mi-skill
description: One sentence covering what it does AND when to trigger. Front-load keyword triggers. Use ONLY cuando...
---

(cuerpo)
```

- `name` obligatorio, minuscula con guiones, <=64 chars, **coincide con el nombre de carpeta**.
- `description` efectivamente obligatorio: sin él la skill se filtra y nunca la ve el modelo. Cubre qué hace Y cuándo se dispara, tercera persona ("Use when...").

## Commands

En `.opencode/commands/<name>.md` (también soporta `command/` singular). `$ARGUMENTS` se reemplaza con lo que el usuario escriba; `$1`, `$2` args posicionales.

```markdown
---
description: Qué hace el comando.
agent: build
---

Cuerpo con $ARGUMENTS...
```

## Fuente de verdad

Esta skill es un resumen. La fuente autorizada es `https://opencode.ai/config.json` (schema) y las docs en `https://opencode.ai/docs/`. Si un campo no está cubierto o hay duda sobre su forma, FETCH el schema y léelo antes de adivinar — un campo mal lleva a config inválida y opencode no arranca.

## Checklist antes de terminar

- [ ] ¿Validé el JSON/JSONC del config editado contra el schema?
- [ ] ¿La skill/agente tiene frontmatter válido (`name`, `description`, `mode`, `model`, `permission`)?
- [ ] ¿Documenté el cambio (AGENTS.md y/o `docs/architecture/system_overview.md`)?
- [ ] ¿Avisé al usuario de reiniciar opencode?