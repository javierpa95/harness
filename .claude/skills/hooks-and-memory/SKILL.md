---
name: hooks-and-memory
description: "Guia completa de hooks y memoria persistente en Claude Code. Usa cuando necesites configurar hooks, entender el sistema de memoria, o crear agentes con memoria persistente."
disable-model-invocation: true
---

# Hooks and Memory — Guia Completa

Guia de referencia para configurar **hooks** (automatizaciones) y **memoria persistente** en agentes Claude Code.

---

## PARTE 1: HOOKS

### Que son los hooks

Los hooks son **scripts que se ejecutan automaticamente** en eventos del ciclo de vida. Validan, bloquean o modifican acciones de los agentes sin que el agente lo sepa.

### Eventos disponibles

| Evento | Cuando se dispara | Caso de uso comun |
|--------|-------------------|-------------------|
| `PreToolUse` | Antes de usar herramienta | Bloquear comandos peligrosos |
| `PostToolUse` | Despues de usar herramienta | Auto-formatear, lintear, loggear |
| `Stop` | Cuando el agente termina | Log de actividad |
| `SubagentStart` | Cuando un subagente empieza | Setup de conexion DB |
| `SubagentStop` | Cuando un subagente termina | Cleanup |
| `UserPromptSubmit` | Antes de procesar prompt | Validar input |

### Donde configurar hooks

**Opcion 1: settings.json** (aplica a toda la sesion)

```json
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...]
  }
}
```

**Opcion 2: Frontmatter del agente** (solo ese agente)

```markdown
---
name: mi-agente
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---
```

### Estructura de un hook

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "./scripts/mi-script.sh"
    }
  ]
}
```

- **matcher**: Patron para filtrar (nombre de herramienta, patron de archivo)
- **hooks**: Array de scripts a ejecutar
- **type**: Siempre `"command"` para scripts
- **command**: El script a ejecutar

### Como reciben datos los hooks

Los hooks reciben JSON por **stdin** con el contexto de la herramienta:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git push origin main"
  },
  "session_id": "abc123",
  "agent_type": "code-reviewer"
}
```

### Codigo de salida

| Exit Code | Que significa |
|-----------|---------------|
| `0` | Exito, permite la operacion |
| `2` | Bloquea la operacion (el error va a stderr) |
| Otro | Error no bloqueante |

### Ejemplos de hooks

**Bloquear comandos peligrosos:**

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'rm -rf|git push.*--force|git reset.*--hard'; then
  echo "BLOCKED: Dangerous command detected" >&2
  exit 2
fi
exit 0
```

**Solo permitir SELECT en DB:**

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b'; then
  echo "BLOCKED: Only SELECT queries allowed" >&2
  exit 2
fi
exit 0
```

**Auto-formatear Python despues de editar:**

```bash
#!/bin/bash
# PostToolUse para Write(*.py)
python3 -m black $CLAUDE_FILE_PATHS 2>/dev/null || true
```

**Log de actividad:**

```bash
#!/bin/bash
# PostToolUse para Bash
echo "[$(date -Iseconds)] Bash command executed" >> .claude/activity.log
```

### Matchers

| Matcher | Ejemplo | Que matchea |
|---------|---------|-------------|
| Nombre exacto | `Bash` | Solo comandos Bash |
| Patron de archivo | `Write(*.py)` | Escritura de archivos .py |
| Patron compuesto | `Edit\|Write` | Edit o Write |
| Sin matcher | (vacio) | Todos los eventos |

---

## PARTE 2: MEMORIA PERSISTENTE

### Que es la memoria

La memoria permite que un agente **aprenda y recuerde** entre sesiones. El agente puede leer y escribir un fichero `MEMORY.md` que persiste.

### Configuracion

```markdown
---
name: mi-agente
memory: project
---
```

### 3 alcances

| Alcance | Ubicacion | Quien la ve |
|---------|-----------|-------------|
| `user` | `~/.claude/agent-memory/<nombre>/` | Todos tus proyectos |
| `project` | `.claude/agent-memory/<nombre>/` | Solo este proyecto (compartible via git) |
| `local` | `.claude/agent-memory-local/<nombre>/` | Solo este proyecto (NO se comitea) |

### Como funciona internamente

1. **Al inicio**: Se inyectan las primeras 200 lineas o 25KB de `MEMORY.md` en el system prompt del agente
2. **Durante**: El agente puede leer y escribir en su directorio de memoria
3. **Al final**: Los cambios persisten para la proxima sesion

### MEMORY.md — Formato

```markdown
# [Nombre del Agente] Memory

## Convenciones del proyecto
- Campos BD: snake_case
- Endpoints: kebab-case
- Tests: pytest con coverage > 80%

## Patrones descubiertos
- El modulo de auth usa JWT, no sesiones
- Las migraciones van en services/backend/migrations/
- PocketBase maneja la auth internamente

## Bugs frecuentes
- Olvidar validar inputs en endpoints POST
- No manejar listas vacias en frontend
- Acceder a props de React sin optional chaining

## Decisiones arquitectonicas
- Usamos Coolify para deploy
- PostgreSQL en produccion, SQLite en dev
- Docker para todos los servicios
```

### Ejemplo: code-reviewer con memoria

```markdown
---
name: code-reviewer
description: "Revisa codigo. Recuerda patrones y convenciones."
tools: Read, Grep, Glob, Bash
memory: project
---

Eres un code reviewer. Antes de revisar:
1. Lee tu MEMORY.md para recordar convenciones
2. Revisa el codigo
3. Al terminar, actualiza tu MEMORY.md con nuevos hallazgos

Actualiza tu memoria con:
- Nuevas convenciones descubiertas
- Bugs recurrentes encontrados
- Decisiones arquitectonicas relevantes
```

### Ejemplo: gdpr-auditor con memoria

```markdown
---
name: gdpr-auditor
description: "Auditoria GDPR. Recuerda vulnerabilidades previas."
tools: Read, Grep, Glob, Bash
memory: project
---

Eres un auditor GDPR. Tu memoria contiene:
- Vulnerabilidades encontradas anteriormente
- Endpoints sensibles conocidos
- Data flows documentados

Al terminar una auditoria, actualiza tu memoria con:
- Nuevos endpoints sensibles encontrados
- Vulnerabilidades corregidas
- Nuevos data flows descubiertos
```

---

## PARTE 3: COMBINAR HOOKS + MEMORIA

### Patron: Agente auto-validado con memoria

```markdown
---
name: backend-developer
description: "Implementa backend con TDD. Valida y recuerda."
tools: Read, Write, Edit, Bash, Grep, Glob
memory: project
hooks:
  PostToolUse:
    - matcher: "Write(*.py)"
      hooks:
        - type: command
          command: "python3 -m py_compile $CLAUDE_FILE_PATHS 2>/dev/null || true"
    - matcher: "Write(*.test.py)"
      hooks:
        - type: command
          command: "python3 -m pytest $CLAUDE_FILE_PATHS -v 2>/dev/null || true"
---

Eres un backend developer con TDD.

Hooks activos:
- PostToolUse Write(*.py): valida sintaxis automaticamente
- PostToolUse Write(*.test.py): ejecuta el test automaticamente

Memoria:
- Lee MEMORY.md al inicio para recordar convenciones
- Actualiza MEMORY.md al terminar con nuevos aprendizajes
```

### Patron: Agente con hooks de seguridad + memoria

```markdown
---
name: gdpr-auditor
description: "Auditoria GDPR con validacion de seguridad."
tools: Read, Grep, Glob, Bash
memory: project
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: |
            INPUT=$(cat)
            COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
            if echo "$COMMAND" | grep -qE 'rm -rf|git push.*--force'; then
              echo "BLOCKED" >&2
              exit 2
            fi
---

Eres un auditor GDPR.
- No puedes ejecutar comandos peligrosos (bloqueado por hooks)
- Recuerda vulnerabilidades previas en tu memoria
- Actualiza tu memoria al terminar
```

---

## PARTE 4: HOOKS EN ESTE PROYECTO

### Hooks activos en .claude/settings.json

| Evento | Matcher | Que hace |
|--------|---------|----------|
| PreToolUse | Bash | Bloquea `rm -rf`, `git push --force`, `git reset --hard` |
| PostToolUse | Write(*.py) | Valida sintaxis Python con py_compile |
| PostToolUse | Write(*.ts) | Valida TypeScript con tsc --noEmit |
| PostToolUse | Write(*.md) | Log de documentacion actualizada |
| Stop | (todos) | Log de actividad en .claude/agent-activity.log |

### Agentes con memoria recomendada

| Agente | memory | Por que |
|--------|--------|---------|
| `code-reviewer` | project | Recuerda convenciones y bugs recurrentes |
| `gdpr-auditor` | project | Recuerda endpoints sensibles y vulnerabilidades |
| `backend-developer` | project | Recuerda patrones de TDD y arquitectura |
| `spec-writer` | project | Recuerda decisiones de spec anteriores |
| `frontend-developer` | local | Patrones UI personales (no compartidos) |

---

## PARTE 5: COMANDOS UTILES

### Ver hooks activos

```bash
cat .claude/settings.json | jq '.hooks'
```

### Ver memoria de un agente

```bash
cat .claude/agent-memory/code-reviewer/MEMORY.md
```

### Limpiar memoria de un agente

```bash
rm -rf .claude/agent-memory/nombre-agente/
```

### Ver log de actividad

```bash
cat .claude/agent-activity.log
```

---

## Referencias

- Claude Code Docs — Hooks: https://code.claude.com/docs/en/automation/hooks
- Claude Code Docs — Memory: https://code.claude.com/docs/en/agents/create-custom-subagents
- Matt Pocock Skills: https://github.com/mattpocock/skills

---

_Esta skill es de referencia. Consulta cuando configures hooks o memoria._
