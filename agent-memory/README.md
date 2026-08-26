# agent-memory/ — Memoria Compartida de Agentes

Este directorio contiene la memoria persistente de los agentes. Es **agnostico** — funciona con Claude Code, OpenCode, o cualquier otra plataforma.

## Estructura

```
agent-memory/
├── code-reviewer/
│   └── MEMORY.md        # Convenciones, bugs, patrones
├── gdpr-auditor/
│   └── MEMORY.md        # Endpoints sensibles, vulnerabilidades
├── backend-developer/
│   └── MEMORY.md        # TDD patterns, arquitectura
└── README.md            # Este fichero
```

## Como funciona

Cada agente tiene un directorio con un `MEMORY.md`. El agente:
1. **Lee** su `MEMORY.md` al inicio de cada sesion
2. **Escribe** en el al terminar (nuevos hallazgos, patrones, etc.)
3. La memoria **persiste** entre sesiones

## Agnosticismo de plataforma

### Claude Code

En el frontmatter del agente:

```markdown
---
name: code-reviewer
memory: project
---
```

Claude Code busca en `.claude/agent-memory/<nombre>/`. Para usar esta memoria compartida, el agente debe referenciar explicitamente `agent-memory/<nombre>/MEMORY.md` en su system prompt.

### OpenCode

En el frontmatter del agente:

```markdown
---
name: code-reviewer
mode: subagent
---
```

OpenCode no tiene memoria persistente nativa. El agente debe:
1. Leer `agent-memory/<nombre>/MEMORY.md` manualmente al inicio
2. Escribir en el al terminar

### Formato recomendado para agentes

En el system prompt de cada agente, anadir:

```markdown
## Memoria

Al iniciar cada sesion:
1. Lee `agent-memory/<nombre>/MEMORY.md` para recordar contextos anteriores
2. Usa esa informacion en tu trabajo

Al terminar la sesion:
1. Actualiza `agent-memory/<nombre>/MEMORY.md` con nuevos hallazgos
2. Manten el fichero conciso y organizado
```

## Convenciones

- **Un directorio por agente**
- **MEMORY.md** como fichero unico de memoria
- **Secciones claras**: Convenciones, Patrones, Bugs, Decisiones
- **Conciso**: Maximo 200 lineas por MEMORY.md
- **En ingles**: Para compatibilidad entre plataformas

## Git

- `agent-memory/` se **comitea** (es compartido entre el equipo)
- `agent-memory-local/` NO se comitea (es personal)
- Excluir de git: `agent-memory-local/`
