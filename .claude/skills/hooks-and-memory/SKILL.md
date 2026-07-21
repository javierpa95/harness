---
name: hooks-and-memory
description: "Guia completa de hooks y memoria persistente agnostica para agentes. Usa cuando configures hooks, entiendas memoria, o crees agentes con memoria compartida."
disable-model-invocation: true
---

# Hooks and Memory — Guia Completa

Guia de referencia para **hooks** y **memoria persistente agnostica** en agentes Claude Code y OpenCode.

---

## PARTE 1: HOOKS (solo Claude Code)

### Que son los hooks

Scripts que se ejecutan automaticamente en eventos del ciclo de vida. Validan, bloquean o modifican acciones.

### Eventos disponibles

| Evento | Cuando se dispara | Caso de uso |
|--------|-------------------|-------------|
| `PreToolUse` | Antes de usar herramienta | Bloquear comandos peligrosos |
| `PostToolUse` | Despues de usar herramienta | Auto-formatear, lintear |
| `Stop` | Cuando el agente termina | Log de actividad |
| `SubagentStart` | Subagente empieza | Setup |
| `SubagentStop` | Subagente termina | Cleanup |

### Donde configurar

**settings.json** (toda la sesion):
```json
{ "hooks": { "PreToolUse": [...] } }
```

**Frontmatter del agente** (solo ese agente):
```markdown
---
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---
```

### Estructura

```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "./script.sh" }]
}
```

### Datos de entrada (JSON por stdin)

```json
{
  "tool_name": "Bash",
  "tool_input": { "command": "git push origin main" },
  "session_id": "abc123",
  "agent_type": "code-reviewer"
}
```

### Exit codes

| Codigo | Significado |
|--------|-------------|
| `0` | Permitir operacion |
| `2` | Bloquear operacion |
| Otro | Error no bloqueante |

### Ejemplos

**Bloquear comandos peligrosos:**
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if echo "$COMMAND" | grep -qE 'rm -rf|git push.*--force'; then
  echo "BLOCKED" >&2; exit 2
fi
exit 0
```

**Solo SELECT en DB:**
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP)\b'; then
  echo "BLOCKED: Only SELECT allowed" >&2; exit 2
fi
exit 0
```

### Hooks activos en este proyecto

| Evento | Matcher | Que hace |
|--------|---------|----------|
| PreToolUse | Bash | Bloquea rm -rf, git push --force |
| PostToolUse | Write(*.py) | Valida sintaxis Python |
| PostToolUse | Write(*.ts) | Valida TypeScript |
| PostToolUse | Write(*.md) | Log de documentacion |
| Stop | (todos) | Log de actividad |

---

## PARTE 2: MEMORIA AGNOSTICA

### El problema

- Claude Code tiene memoria nativa (`memory: project`)
- OpenCode NO tiene memoria nativa
- La memoria debe ser **compartida** entre plataformas

### La solucion: `agent-memory/` en raiz

```
proyecto/
├── agent-memory/              ← MEMORIA COMPARTIDA
│   ├── code-reviewer/
│   │   └── MEMORY.md
│   ├── gdpr-auditor/
│   │   └── MEMORY.md
│   └── backend-developer/
│       └── MEMORY.md
├── .claude/agents/            ← Claude Code
├── .opencode/agents/          ← OpenCode
├── CLAUDE.md
└── AGENTS.md
```

### Como funciona

**En el system prompt de cada agente:**

```markdown
## Memoria

Al iniciar:
1. Lee `agent-memory/<nombre>/MEMORY.md`

Al terminar:
1. Actualiza `agent-memory/<nombre>/MEMORY.md`
```

### Claude Code — Configuracion

En el frontmatter:
```markdown
---
name: code-reviewer
memory: project
---
```

**Nota:** `memory: project` usa `.claude/agent-memory/` por defecto. Para usar `agent-memory/` compartido, el agente debe referenciar la ruta explicitamente en su prompt.

### OpenCode — Configuracion

OpenCode no tiene `memory` field. El agente simplemente lee/escribe en `agent-memory/` via su system prompt.

### Formato de MEMORY.md

```markdown
# [Agente] Memory

## Convenciones del proyecto
- [convencion 1]
- [convencion 2]

## Patrones descubiertos
- [patron 1]
- [patron 2]

## Bugs recurrentes
- [bug 1]
- [bug 2]

## Decisiones arquitectonicas
- [decision 1]
- [decision 2]
```

### Agentes con memoria

| Agente | MEMORY.md | Que recuerda |
|--------|-----------|--------------|
| code-reviewer | `agent-memory/code-reviewer/MEMORY.md` | Convenciones, bugs, patrones |
| gdpr-auditor | `agent-memory/gdpr-auditor/MEMORY.md` | Endpoints sensibles, vulnerabilidades |
| backend-developer | `agent-memory/backend-developer/MEMORY.md` | TDD patterns, arquitectura |

---

## PARTE 3: COMBINAR HOOKS + MEMORIA

### Patron: Agente auto-validado con memoria

```markdown
---
name: backend-developer
tools: Read, Write, Edit, Bash
memory: project
hooks:
  PostToolUse:
    - matcher: "Write(*.py)"
      hooks:
        - type: command
          command: "python3 -m py_compile $CLAUDE_FILE_PATHS 2>/dev/null || true"
---

## Memoria
Al iniciar: lee `agent-memory/backend-developer/MEMORY.md`
Al terminar: actualiza `agent-memory/backend-developer/MEMORY.md`

## Hooks
PostToolUse Write(*.py): valida sintaxis automaticamente
```

---

## PARTE 4: COMANDOS UTILES

### Ver hooks activos
```bash
cat .claude/settings.json | jq '.hooks'
```

### Ver memoria de un agente
```bash
cat agent-memory/code-reviewer/MEMORY.md
```

### Limpiar memoria
```bash
rm -rf agent-memory-local/nombre-agente/
```

### Ver log de actividad
```bash
cat .claude/agent-activity.log
```

---

## Referencias

- Claude Code Hooks: https://code.claude.com/docs/en/automation/hooks
- Claude Code Agents: https://code.claude.com/docs/en/agents/create-custom-subagents
- Matt Pocock Skills: https://github.com/mattpocock/skills

---

_Esta skill es de referencia. Consulta cuando configures hooks o memoria._
