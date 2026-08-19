# Agent Patterns — Guia de Agentes en OpenCode y Claude Code

**Version:** 0.1.0
**Ultima actualizacion:** [DATE]

---

## Que son los Agentes

En OpenCode y Claude Code, un **agente** es un AI assistant especializado configurado para un rol especifico. No es solo un chatbot — un agente tiene:

- Un **prompt** (sistema) que define su comportamiento
- Una **descripción** que le dice al LLM principal cuando usarlo
- **Herramientas** (permisos) que puede o no usar
- (Opcional) Un **modelo** especifico optimizado para el rol

---

## Tipos de Agentes

### Primary Agent

El agente principal con el que interactuas directamente. Es el "tu" del projecto.

- Ciclas entre primary agents con `Tab`
- Maneja la conversacion principal
- Tiene acceso a todo lo que needs
- En el harness: `project-architect` (OpenCode) / `CLAUDE.md` (Claude Code)

### Subagent

Agentes especializados que los primary agents invocan para tareas especificas. Se invocan con `@` o automaticamente.

- Ejemplo: Cuando el architect necesita un code review, delega a `code-reviewer`
- Cada subagente tiene su propio scope, herramientas y modelo
- En el harness: spec-writer, frontend-developer, backend-developer, code-reviewer, etc.

---

## Arquitectura del Harness

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECT                             │
│  (CLAUDE.md en Claude Code / project-architect en OC)   │
│                                                         │
│  1. ANALYZE → 2. SPEC → 3. IMPLEMENT → 4. REVIEW →     │
│  5. DOCS → 6. DECIDE                                    │
└─────────────────────────────────────────────────────────┘
          │           │            │          │
          ▼           ▼            ▼          ▼
     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
     │  spec-  │ │frontend/│ │  code-  │ │  docs-  │
     │ writer  │ │backend- │ │reviewer │ │ auditor │
     │         │ │developer│ │ (2 ejes)│ │         │
     └─────────┘ └─────────┘ └─────────┘ └─────────┘
                                               │
                                               ▼
                                     ┌──────────────┐
                                     │ gdpr-auditor │
                                     │ (si hay data)│
                                     └──────────────┘
```

---

## Como se definiene los Agentes

### En OpenCode (Markdown)

Cada agente es un `.opencode/agents/NOMBRE.md`:

```markdown
---description: Reviews code for quality and best practicesmode: subagentmodel: anthropic/claude-sonnet-4-20250514temperature: 0.1permission:  edit: deny  bash:    "*": ask    "git diff": allow    "git log*": allow    "grep *": allow  webfetch: deny---You are in code review mode. Focus on:
- Code quality and best practices- Potential bugs and edge cases- Performance implications- Security considerations
Provide constructive feedback without making direct changes.
```

La estructura es:
- **Frontmatter**: metadata del agente (descripción, modo, modelo, permisos)
- **Cuerpo**: prompt del agente (system instructions)

### En Claude Code (Markdown)

El mismo agente se replica en `.claude/agents/NOMBRE.md`. Es un mirror byte-a-byte de la estructura.

### En OpenCode (JSON)

Tambien se pueden definir en `opencode.jsonc`:

```jsonc
{
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for quality and best practices",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "permission": {
        "edit": "deny",
        "bash": "ask"
      }
    }
  }
}
```

### En Claude Code (settings.json)

Para Claude Code se define en `mcpServers` dentro de settings.json o en el CLAUDE.md principal para el architect.

---

## Crear un Nuevo Agente

### Paso 1: Definir el rol

Antes de escribir el agente, decide:

1. **Que hace:** Descripcion corta y precisa
2. **Cuando se usa:** El architect decide invocarlo
3. **Permision:** Que herramientas necesita? (Solo lectura? Bash? Edit?)

### Paso 2: Escribir el prompt

Un buen prompt de agente tiene:

```markdown---description: [Rol del agente]
mode: subagentmodel: [modelo opcion]temperature: [0.1 para focus, 0.7 para creative]permission:  edit: [allow/deny/ask]  bash: [allow/deny/ask]---[Contexto del rol]

[Instrucciones especificas]

[Formato de salida deseado]- [Criterio 1 para saber si hizo bien]
- [Criterio 2 para saber si hizo bien]---```

### Paso 3: Crear archivos

```bash
# OpenCode
echo '[contenido del agente]' > .opencode/agents/NOMBRE.md

# Claude Code (mirror)cp .opencode/agents/NOMBRE.md .claude/agents/NOMBRE.md
```

### Paso 4: Actualizar la doc

- `.opencode/agents/README.md` (si existe)
- `HARNESS_SUMMARY.md` → seccion "Agentes"
- `AGENTS.md` / `CLAUDE.md` → tabla de agentes

---

## Patrones Comunes

### Patrón 1: Read-only / Auditor

Agentes que solo leen y dan feedback, nunca escriben:

```markdown---description: Performs security audits and identifies vulnerabilitiesmode: subagentpermission:  edit: deny  write: deny---You are a security expert. Focus on identifying potential security issues.LOOK for but DO NOT fix:
- Input validation vulnerabilities
- Authentication and authorization flaws- Data exposure risks- Dependency vulnerabilities
- Configuration security issuesReport findings in this format:**Severity**: CRITICAL / HIGH / MEDIUM / LOW**Impact**: [descripcion]
**File**: [paths]**Recommendation**: [sugerencia]---```

### Patrón 2: Implementador con TDD

Agentes que implementan con TDD (tests primero):```markdown---description: Implements backend APIs with TDD (Red → Green → Refactor)mode: subagent---You are a backend developer. You ALWAYS follow the TDD cycle:1. RED: Write the test that defines the expected behavior2. GREEN: Write the minimum code to pass the test3. REFACTOR: Clean up the code without breaking tests4. REPEAT: Move to next behaviorRules:- Tests ALWAYS before implementation- Each acceptance criteria = at least one test- Use the provided test framework- No shortcuts, no skipping steps---

### Patrón 3: Orquestador

Agentes que delegan a otros agentes (el pattern del architect):

```markdown
---
ddescription: Orchestrates SDD — analyzes, delegates, decides
mode: primary
permission:
  edit: allow
  bash: allow
---
You are the project architect. Your ONLY job is to orchestrate the SDD flow:

1. ANALYZE the user's request
2. Delegate to spec-writer for documentation
3. Delegate to developers for implementation
4. Delegate to code-reviewer for verification
5. Decide: PASS (commit) or FAIL (iterate)

CRITICAL RULES:- NEVER implement without a spec- NEVER commit without review (except trivial changes)- Use appropriate MCP tools when helpful (codegraph, context7)
```

### Patrño 4: Handoff (Transferencia de Contexto)

Agentes que se usan para transferir contexto entre sesiones o agentes:```markdown
---
description: Transfers context from one agent or session to anothermode: subagent
---
You are a handoff specialist. When another agent needs to transfer context to a different agent or future session:

1. Capture: What was done, what changed, what matters next2. Format: Structured document with key info3. Redact: Remove secrets, keys, credentials
```

---

## Mejores Practicas

### 1. Especifica las permisiones mininas

Siempre empieza con el minimo de permisos necesario:

```yaml
permission:  edit: deny  bash: "*": deny```

Solo habilita lo que sea estrictamente necesario.

### 2. Usa subagentes para especializacion

Cada subagente deberia tener UN solo objetivo bien definido. Si un agente hace 10 cosas diferentes, dividelo en 2-3 agentes especializados.

### 3. Modelos apropiados

| Agente | Modelo recomendado | Por que |
|--------|-------------------|--------|
| Architect | Sonnet/Pro | Necesita thinking profundo |
| Code reviewer | Sonnet/Pro | Necesita understanding de codigo |
| Spec writer | Any good model | Es puro writing/estructura |
| Developer | Sonnet/Pro | Necesita thinking + implementation |

### 4. Descripcion es la clave

La `description` del agente es lo que el LLM primario usa para decidir si invocarlo. Debe ser:

- **Clara**: "Reviews code for quality" > "Does stuff with code"
- **Especifica**: "Reviews code for security vulnerabilities and performance issues" > "Reviews code"
- **Accionnable**: El architect debe poder usar "use code-reviewer" y saber exactamente que esperar

### 5. Mantener el mirror sincronizado

Siempre mantener las versiones de OpenCode y Claude Code sincronizadas:```bash# En .bashrc o .zshrcalias sync-agents='cp .opencode/agents/*.md .claude/agents/ 2>/dev/null || true'alias sync-agents='for f in .opencode/agents/*.md; do cp "$f" ".claude/agents/$(basename $f)"; done'alias sync-agents='cp .opencode/agents/*.md .opencode/agents/*.md .claude/agents/'
```

---

## Debugging de Agentes

### El architect no invoca tu agente

El architect usa la `description` del agente para decidir invocarlo. Si no aparece, verifica que:

1. La `description` es clara y relevante
2. El archivo esta en el lugar correcto (`.opencode/agents/` para OpenCode)
3. El formato del frontmatter es correcto (`description`, `mode`, etc.)

### El subagente hace demasiado o muy poco

- Verificar el prompt — debe ser especifico, no ambiguo.
- Verificar las permisiones — demasiados permisos pueden hacer que haga cosas no deseadas.
- Ajustar `temperature` — 0.1 para focus, 0.7 para creatividad.

### El subagente no respeta las reglas

- El prompt es la clave. Usa bullet points y reglas explícitas.
- Añade ejemplos de formato de salida esperado.
- Usa "CRITICAL RULES" section para las cosas que NUNCA deben hacer.

---

## Recursos

- [OpenCode Agent docs](https://opencode.ai/docs/agents/)
- [Claude Code Agent docs](https://docs.anthropic.com/en/docs/claude-code/agents)
- [OpenCode Permissions docs](https://opencode.ai/docs/permissions/)
- [Prompt Engineering Guide](https://www.promptingguide.tech/)

---

_Esta guia se actualiza con nuevos patrones y mejores practicas._