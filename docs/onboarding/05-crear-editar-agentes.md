# 05 · Crear y editar agentes

> **Qué sabés después de leer esto:** cómo crear un agente nuevo, editar el frontmatter de uno existente, diferenciar primario de subagente, y cómo delegar entre ellos. Es la base para configurar roles a medida del proyecto.

---

## Lo fundamental en una tabla

| Campo | Qué hace | ¿Obligatorio? |
|-------|----------|:---:|
| `name` | Nombre del agente (el nombre del archivo `.md`) | ✔ |
| `description` | Para qué sirve y cuándo usarlo | ✔ |
| `mode` | `primary` · `subagent` · `all` | ✔ |
| `model` | Modelo propio (`provider/model-id`) | ✖ (hereda si falta) |
| `color` | Color del agente en la UI | ✖ |
| `permission` | Reglas de herramientas del agente | ✖ (usa defaults) |
| `temperature` / `top_p` | Creatividad / diversidad de las respuestas | ✖ |
| `steps` | Máx. de iteraciones (control de costos) | ✖ |
| `disable` | `true` desactiva el agente | ✖ |

## Dónde viven los agentes

```
.opencode/agents/<nombre>.md     ← por proyecto (se commitea en el template)
~/.config/opencode/agents/       ← global (todos tus proyectos)
```

Para este harness, los agentes **por proyecto** (`.opencode/agents/`) es lo correcto — así quien copia el template hereda los roles.

## Crear un agente

1. Creá `.opencode/agents/<tu-agente>.md`.
2. Frontmatter con `name`, `description`, `mode` (y lo que necesites).
3. El **body markdown** es el *prompt* del agente: qué hace, qué NO hace, reglas, formato de salida.

```markdown
---
name: my-agent
description: Does X. Use when...
mode: subagent
model: nan/deepseek-v4-flash
permission:
  edit: deny
  bash: ask
---

You are the my-agent. In this project you:
- Read and analyze ...
- You never edit source files.
```

> El body ES el prompt — no pongas también `prompt:` en el frontmatter. Y `name` del archivo debe coincidir con el `name` del frontmatter.

## Primario vs subagente

| | Primario (`primary`) | Subagente (`subagent`) |
|---|---|---|
| Interactúa directo con vos | ✔ (Tab para ciclar) | ✖ |
| Lo invoca otro agente (Task) | — | ✔ |
| Lo invocás manualmente con `@nombre` | ✔ | ✔ |
| Modelo | usa `model` o el global | usa `model` o **el del primario que lo invoca** |

## Permisos por agente

Se puede sobrescribir la permission global por herramienta y por patrón. El agente **puede relajar o restringir** el global — los permisos de agente tienen precedencia:

```yaml
permission:
  edit: deny            # no edita nada (revisor)
  bash: { "*": "ask", "git diff": "allow" }
  webfetch: deny
```

> ⚠️ **Gotcha clave:** si el proyecto declara un `deny` gran vivlo (ej. `.opencode/**/*`), el `edit: allow` (shorthand) de un agente **no siempre lo gana**. Para que un agente pueda editar el harness, declará la regla específica en su frontmatter:
> ```yaml
> permission:
>   edit: { "*": "allow", ".opencode/**/*": "allow" }
> ```

## Delegar con permissions `task`

El campo `permission.task` controla qué subagentes puede lanzar un primario vía la herramienta Task:

```yaml
permission:
  task:
    "*": "deny"
    "code-reviewer": "allow"
    "spec-writer": "ask"
```

Se evalúa en orden, **la última regla que matchea gana** (poné `*` primero).

## Regla de oro

> Un agente debe tener SOLO los permisos que su rol exige (**mínimo privilegio**). Revisores y auditores → read-only. Developers → escritura acotada. Cada permiso extra es superficie de riesgo.

**Siguiente:** [Capítulo 06 — MCP servers](06-servidores-mcp.md)

---
*¿Creaste un agente a medida de tu stack? Documentalo acá para que quede como patrón reutilizable.*