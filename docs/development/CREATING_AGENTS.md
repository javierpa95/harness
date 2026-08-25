# Creating Agents — Guia para Claude Code y OpenCode

Esta guia documenta como crear agentes personalizados para ambas plataformas. Cada plataforma tiene su propio formato, pero la logica es similar.

---

## Tabla Comparativa

| Caracteristica | Claude Code | OpenCode |
|---------------|-------------|----------|
| **Directorio** | `.claude/agents/` | `.opencode/agents/` |
| **Formato** | Markdown + YAML frontmatter | Markdown + YAML frontmatter |
| **Config principal** | `CLAUDE.md` | `AGENTS.md` |
| **Settings** | `.claude/settings.json` | `.opencode/opencode.jsonc` |
| **Skills** | `.claude/skills/` | `.opencode/skills/` |
| **Commands** | `.claude/commands/` | `.opencode/commands/` |
| **Invocacion** | `@agent-name` o automatica | `@agent-name` o por nombre |
| **Subagentes** | Si (anidados posibles) | Si (limitados) |
| **Modelo** | Configurable por agente | Configurable por agente |
| **Hooks** | PreToolUse, PostToolUse, etc. | No disponibles |
| **Memory** | Persistente (user/project/local) | No disponible |
| **Worktrees** | Si (aislamiento git) | No disponible |

---

## Claude Code — Crear Agentes

### Ubicacion

| Ubicacion | Alcance | Prioridad |
|-----------|---------|-----------|
| `.claude/agents/` | Proyecto actual | 3 |
| `~/.claude/agents/` | Todos tus proyectos | 4 |
| Plugin `agents/` | Donde se instala el plugin | 5 (baja) |
| `--agents` CLI | Solo esta sesion | 2 |
| Managed settings | Organizacion | 1 (alta) |

### Formato del Archivo

```markdown
---
name: nombre-del-agente
description: "Cuando usar este agente. Claude usa esta descripcion para decidir cuando delegar."
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: default
maxTurns: 10
skills:
  - skill-name-1
  - skill-name-2
memory: project
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

Eres un especialista en [dominio]. Tu trabajo es [que haces].

Cuando se te invoca:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

Reglas:
- [Regla 1]
- [Regla 2]
```

### Campos de Frontmatter

| Campo | Requerido | Descripcion |
|-------|-----------|-------------|
| `name` | Si | Identificador unico (minusculas y guiones) |
| `description` | Si | Cuando delegar a este agente |
| `tools` | No | Herramientas permitidas (hereda todas si se omite) |
| `disallowedTools` | No | Herramientas a denegar |
| `model` | No | Modelo: `sonnet`, `opus`, `haiku`, `fable`, `inherit` |
| `permissionMode` | No | `default`, `acceptEdits`, `auto`, `bypassPermissions`, `plan` |
| `maxTurns` | No | Maximo de turnos antes de parar |
| `skills` | No | Skills a precargar en el contexto |
| `memory` | No | Alcance de memoria persistente: `user`, `project`, `local` |
| `hooks` | No | Hooks de lifecycle (PreToolUse, PostToolUse, etc.) |
| `mcpServers` | No | Servidores MCP disponibles |
| `background` | No | `true` para siempre ejecutar en background |
| `isolation` | No | `worktree` para aislamiento git |
| `color` | No | Color de display: `red`, `blue`, `green`, etc. |
| `effort` | No | Nivel de esfuerzo: `low`, `medium`, `high`, `max` |

### Herramientas Disponibles

| Herramienta | Que hace |
|-------------|----------|
| `Read` | Leer archivos |
| `Write` | Crear/escribir archivos |
| `Edit` | Editar archivos existentes |
| `Bash` | Ejecutar comandos shell |
| `Grep` | Buscar en contenido de archivos |
| `Glob` | Buscar archivos por patron |
| `Agent` | Spawnear subagentes |
| `WebSearch` | Buscar en web |
| `WebFetch` | Obtener contenido de URLs |

### Ejemplo: Code Reviewer

```markdown
---
name: code-reviewer
description: "Revisa codigo para calidad, seguridad y mejores practicas. Usa despues de escribir o modificar codigo."
tools: Read, Grep, Glob, Bash
model: sonnet
---

Eres un revisor de codigo senior. Cuando se te invoca:

1. Ejecuta `git diff` para ver cambios recientes
2. Enfocate en archivos modificados
3. Revisa inmediatamente

Checklist de revision:
- Codigo claro y legible
- Funciones y variables bien nombradas
- Sin codigo duplicado
- Manejo adecuado de errores
- Sin secretos expuestos
- Validacion de inputs
- Buena cobertura de tests
- Consideraciones de performance

Organiza feedback por prioridad:
- Criticos (deben fixearse)
- Advertencias (deberian fixearse)
- Sugerencias (mejorar)

Incluye ejemplos especificos de como fixear.
```

### Ejemplo: GDPR Auditor

```markdown
---
name: gdpr-auditor
description: "Auditoria de seguridad y privacidad. Revisa cambios en busca de credenciales expuestas y anti-patrones."
tools: Read, Grep, Glob, Bash
model: inherit
permissionMode: default
---

Eres un auditor de seguridad y privacidad. Tu trabajo es auditar cambios y reportar hallazgos.

Checklist:
- Credenciales hardcodeadas
- Endpoints admin sin auth
- Datos personales en logs
- Inputs sin validacion
- Politica de privacidad accesible

Reporta con severidad: CRITICO, ADVERTENCIA, INFO.
```

---

## OpenCode — Crear Agentes

### Ubicacion

| Ubicacion | Alcance |
|-----------|---------|
| `.opencode/agents/` | Proyecto actual |
| `~/.opencode/agents/` | Todos tus proyectos (si soportado) |

### Formato del Archivo

```markdown
---
name: nombre-del-agente
description: "Descripcion del agente"
mode: subagent
color: '#HEXCODE'
temperature: 0.2
permission:
  edit:
    '*': 'deny'
    'ruta/permitida/**/*': 'allow'
  bash: 'ask'
  read: 'allow'
  question: 'allow'
tools:
  '*': true
---

# Nombre del Agente

Eres el [Nombre] del proyecto. Tu trabajo es [que haces].

## Jerarquia de Autoridad
1. `AGENTS.md`
2. `docs/architecture/system_overview.md`
3. `.opencode/rules/*.md`

## Cuando se te invoca
| Situacion | Tu accion |
|-----------|-----------|
| [Situacion 1] | [Accion 1] |
| [Situacion 2] | [Accion 2] |

## Reglas
- [Regla 1]
- [Regla 2]

## Reporte de Salida
```
[Formato del reporte]
```

> "Frase final del agente."
```

### Campos de Frontmatter

| Campo | Requerido | Descripcion |
|-------|-----------|-------------|
| `name` | Si | Identificador unico |
| `description` | Si | Descripcion del agente |
| `mode` | No | `primary` (orquestador) o `subagent` (trabajador) |
| `color` | No | Color HEX para display |
| `temperature` | No | Temperatura del modelo (0.0-1.0) |
| `permission` | No | Permisos de edit/bash/read/question |
| `tools` | No | Herramientas habilitadas |

### Permisos en OpenCode

```yaml
permission:
  edit:
    '*': 'deny'             # Catch-all PRIMERO
    'docs/**/*': 'allow'    # Reglas especificas DESPUES (la ultima coincidencia gana)
    'src/**/*': 'ask'
  bash:
    '*': 'ask'              # Preguntar para otros comandos
    'git *': 'allow'        # Git sin preguntar
    'npm *': 'allow'        # npm sin preguntar
  read: 'allow'             # Leer todo
  question: 'allow'         # Preguntar al usuario
```

> **IMPORTANTE**: La **ULTIMA regla que coincide gana** (doc oficial de Permisos). Si pones el catch-all `'*'` al final, anula todas las whitelists anteriores. Verificado 2026-08-25 en https://opencode.ai/docs/es/permissions/.

### Diferencias Clave con Claude Code

| Aspecto | Claude Code | OpenCode |
|---------|-------------|----------|
| **Hooks** | PreToolUse, PostToolUse, Stop, etc. | No disponibles |
| **Memory** | Persistente (user/project/local) | No disponible |
| **Worktrees** | Aislamiento git por subagente | No disponible |
| **Modelo** | `sonnet`, `opus`, `haiku`, `inherit` | Configuracion global |
| **Temperature** | No configurable por agente | Si configurable |
| **Subagentes anidados** | Si (hasta 5 niveles) | Limitado |
| **Background** | Si (por defecto) | No |

---

## Mejores Practicas (Ambas Plataformas)

### 1. Diseno de Agentes

- **Un agente, un proposito**: Cada agente debe excellence en una tarea especifica
- **Descripcion clara**: Claude/OpenCode usa la descripcion para decidir cuando delegar
- **Herramientas minimas**: Otorga solo las herramientas necesarias
- **Prompt detallado**: Incluye pasos especificos, no solo "revisa el codigo"

### 2. Estructura de Agentes

```
proyecto/
├── .claude/agents/          # Claude Code
│   ├── code-reviewer.md
│   ├── gdpr-auditor.md
│   └── backend-developer.md
├── .opencode/agents/        # OpenCode
│   ├── code-reviewer.md
│   ├── gdpr-auditor.md
│   └── backend-developer.md
├── CLAUDE.md                # Contexto Claude Code
└── AGENTS.md                # Contexto OpenCode
```

### 3. SDD Flow (para agentes de desarrollo)

```
1. ANALYZE  → Architect analiza la peticion
2. SPEC     → Spec Writer crea/actualiza la spec
3. IMPLEMENT → Developers implementan (TDD en backend)
4. REVIEW   → Code Reviewer verifica (2 ejes)
5. DECIDE   → Architect: PASS o FAIL
```

### 4. Code Review en 2 Ejes

```
Eje Standards: ¿El codigo sigue las convenciones?
Eje Spec: ¿El codigo implementa lo que pedia la spec?

Ambos en paralelo, reportes separados.
```

---

## Referencias

| Fuente | Link |
|--------|------|
| Claude Code Docs — Agents | https://code.claude.com/docs/en/agents |
| Claude Code — Custom Subagents | https://code.claude.com/docs/en/agents/create-custom-subagents |
| OpenCode (archived) | https://github.com/opencode-ai/opencode |
| Matt Pocock Skills | https://github.com/mattpocock/skills |

---

_Esta guia evoluciona con las plataformas. Actualizala cuando cambien los formatos._
