# ATTRIBUTION.md — De donde viene cada cosa

Este documento documenta las fuentes de ideas, patrones y mejoras integradas en el harness. Transparencia total sobre que se hisho propio y que se robo (con credito).

---

## Fuentes Principales

### 1. Matt Pocock — mattpocock/skills
- **Repo**: https://github.com/mattpocock/skills
- **Stars**: 180k+ | **Forks**: 15.3k+
- **Que es**: Skills para Claude Code organizados en categories (engineering, productivity, misc, personal)
- **Licencia**: MIT

### 2. 0.harnes Original (este proyecto)
- **Autor**: Javier
- **Queue es**: Template SDD + TDD con harness de agentes de IA
- **GitHub**: https://github.com/javierpa95/0.harnes

---

## Ideas Integradas

### Del repositorio de Matt Pocock

| Idea | Skill original | Donde va en nuestro harness | Que cambio |
|------|---------------|---------------------------|------------|
| **Code Review en 2 ejes** | `skills/engineering/code-review/SKILL.md` | `.opencode/agents/code-reviewer.md` | Adaptado a nuestro formato de agentes (no skills). Mantenemos el baseline de code smells de Fowler. |
| **Handoff document** | `skills/productivity/handoff/SKILL.md` | `.opencode/skills/handoff/SKILL.md` | Simplificado. Sin dependencia de issue tracker externo. |
| **Grilling (entrevista relajada)** | `skills/productivity/grilling/SKILL.md` | `.opencode/agents/project-architect.md` (modo grilling) | Integrado como modo del architect, no skill separada. |
| **Context.md como glosario** | `skills/engineering/domain-modeling/SKILL.md` | `CONTEXT.md` en raiz del proyecto | Simplificado a glosario basico. Sin ADRs por ahora. |
| **User-invoked vs Model-invoked** | `.agents/invocation.md` | Documentado en CLAUDE.md del harness | Como referencia, no como implementacion directa. |
| **Vocabulario tecnico compartido** | `skills/engineering/codebase-design/SKILL.md` | `CONTEXT.md` (seccion Convenciones de Nombres) | Solo las convenciones, no el vocabulario completo de modulos. |

### Originales del 0.harnes (sin cambio)

| Componente | Que es | Por que se mantiene |
|------------|--------|---------------------|
| **GDPR Auditor** | Auditoria de seguridad y privacidad | Especifico para datos de salud. Matt no maneja esto. |
| **Release Manager** | Versionado y releases | Workflow completo que Matt no tiene. |
| **SDD Flow** | Specification-Driven Development | Mas riguroso que el flujo de Matt. |
| **TDD en backend** | Red-Green-Refactor obligatorio | Bien definido, funciona. |
| **Docker/CI templates** | docker-compose.yml, GitHub Actions | Listos para Coolify. |

---

## Que NO se integro (y por que)

| Idea de Matt | Por que no |
|-------------|------------|
| **ask-matt (router de skills)** | Nuestro architect ya es el router. No necesitamos un skill separado. |
| **ADR (Architecture Decision Records)** | Util pero premature para templates. Se puede anadir despues. |
| **CONTEXT-MAP.md** (multi-contexto) | Solo tenemos un contexto por proyecto. |
| **Claude Code plugin** | Matt distribuye como plugin. Nosotros como template cloneable. |
| **docs/ publicados en aihero.dev** | Matt publica docs en web. Nosotros mantenemos todo en el repo. |

---

## Referencias Adicionales

| Fuente | Que se uso | Link |
|--------|-----------|------|
| **Martin Fowler — Refactoring** | Baseline de code smells (ch.3) | https://martinfowler.com/articles/refactoring-a-book-list.html |
| **Michael Feathers — Working Effectively with Legacy Code** | Concepto de "seam" | https://feathersworking.com/ |
| **John Ousterhout — A Philosophy of Software Design** | Concepto de "deep module" (referenciado, no integrado) | https://www.amazon.com/Philosophy-Software-Design-John-Ousterhout/dp/1732102201 |

---

## Como se hisho

1. **Analisis**: Se reviso el repo de Matt Pocock en profundidad (16 jul 2025)
2. **Evaluacion**: Se identificaron ideas compatibles con nuestro harness
3. **Adaptacion**: Se modificaron para encajar en nuestro formato `.opencode/agents/`
4. **Integracion**: Se anadieron sin romper el flujo SDD existente
5. **Documentacion**: Este fichero registra todo para transparencia

---

## Version

- **Harness**: 0.1.0
- **Ultima actualizacion**: 16 julio 2025
- **Proxima revision**: Cuando Matt actualice sus skills o cuando necesitemos nuevas ideas

---

_"Todo arte es derivado. Lo importante es attribuir las fuentes y adaptar las ideas a tu contexto."_

---

## Claude Code Mirror

### Estructura .claude/

| Archivo | Funcion | Equivalente en .opencode/ |
|---------|---------|--------------------------|
| `CLAUDE.md` | Contexto principal (auto-cargado) | `AGENTS.md` |
| `.claude/settings.json` | Permisos, hooks, seguridad | `.opencode/opencode.jsonc` |
| `.claude/commands/start.md` | Comando /start | `.opencode/commands/start.md` |
| `.claude/commands/end.md` | Comando /end | `.opencode/commands/end.md` |
| `.claude/skills/handoff/SKILL.md` | Skill de transferencia | `.opencode/skills/handoff/SKILL.md` |

### Diferencias clave con OpenCode

| Caracteristica | OpenCode | Claude Code |
|---------------|----------|-------------|
| Contexto principal | `AGENTS.md` | `CLAUDE.md` |
| Configuracion | `.opencode/opencode.jsonc` | `.claude/settings.json` |
| Agentes | `.opencode/agents/*.md` | `.claude/agents/*.md` |
| Skills | `.opencode/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| Commands | `.opencode/commands/*.md` | `.claude/commands/*.md` |
| Plugin format | No aplica | `.claude-plugin/plugin.json` |

### Por que ambos formatos?

- **OpenCode**: Para uso con OpenCode CLI (el agente de Matt Pocock)
- **Claude Code**: Para uso con Claude Code CLI (Anthropic)
- **Coexisten**: Ambos pueden estar en el mismo repo sin conflictos
- **Flexibilidad**: El usuario elige que agente usar segun el caso

---

## Hooks y Memoria (Claude Code)

### Fuentes

| Fuente | Que se uso | Link |
|--------|-----------|------|
| Claude Code Docs — Hooks | Eventos, matchers, exit codes, ejemplos | https://code.claude.com/docs/en/automation/hooks |
| Claude Code Docs — Agents | Memory field, scopes, MEMORY.md | https://code.claude.com/docs/en/agents/create-custom-subagents |
| Matt Pocock — hooks patterns | PreToolUse para validar comandos | https://github.com/mattpocock/skills |

### Hooks implementados

| Hook | Evento | Que hace | Fuente |
|------|--------|----------|--------|
| Security guard | PreToolUse Bash | Bloquea comandos peligrosos | Claude Code docs |
| Python validator | PostToolUse Write(*.py) | Valida sintaxis | Comun en projects |
| TypeScript validator | PostToolUse Write(*.ts) | Valida tipos | Comun en projects |
| Docs logger | PostToolUse Write(*.md) | Log de cambios | Custom |
| Activity logger | Stop | Log de actividad | Custom |

### Memoria implementada

| Agente | Scope | Que recuerda | Fuente |
|--------|-------|--------------|--------|
| code-reviewer | project | Convenciones, bugs, patrones | Claude Code docs |
| gdpr-auditor | project | Endpoints sensibles, vulnerabilidades | Claude Code docs |
| backend-developer | project | TDD patterns, arquitectura | Claude Code docs |

---

## Docs Auditor

### Inspiracion

| Fuente | Que se uso | Link |
|--------|-----------|------|
| Matt Pocock — writing-docs.md | Convencion de que los agentes mantienen docs | https://github.com/mattpocock/skills |
| Claude Code docs — Hooks | PostToolUse para validar actualizaciones | https://code.claude.com/docs/en/automation/hooks |
| 0.harnes original | SDD flow con revision obligatoria | Este proyecto |

### Concepto

El docs-auditor es un **agente de validacion** que:
- No edita archivos (solo lectura)
- Verifica que cambios de codigo tengan su documentacion
- Se ejecuta como paso obligatorio antes de commit
- Tiene memoria compartida (agent-memory/docs-auditor/)

### Por que es importante

Sin un docs-auditor:
- El CHANGELOG se queda sin actualizar
- El system_overview pierde sincronia con el codigo
- Las specs quedan con status incorrecto
- CONTEXT.md no refleja nuevos terminos

Con un docs-auditor:
- Siempre hay documentacion actualizada
- Los nuevos desarrolladores entienden el codigo
- Los agentes tienen contexto correcto
- El proyecto mantiene calidad a largo plazo

---

## Git Workflow y Herramientas

### Fuentes

| Fuente | Que se uso | Link |
|--------|-----------|------|
| Conventional Commits | Formato de mensajes de commit | https://www.conventionalcommits.org/ |
| Husky | Git hooks manager | https://typicode.github.io/husky/ |
| commitlint | Validación de mensajes | https://commitlint.js.org/ |
| gitattributes | Normalización de line endings | https://git-scm.com/docs/gitattributes |
| angular/.github | Referencia de conventional commits | https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit |

### Herramientas integradas

| Herramienta | Que hace | Hooks |
|-------------|----------|-------|
| Husky | Gestiona git hooks | pre-commit, commit-msg |
| commitlint | Valida mensajes de commit | commit-msg |
| .gitattributes | Normaliza line endings | N/A |
| .gitignore | Excluye archivos innecesarios | N/A |

### Convenciones adoptadas

| Convencion | De donde | Por que |
|------------|----------|---------|
| Conventional Commits | Angular/Google | Estandar de la industria |
| Husky | Typicode | Popular, bien mantenido |
| commitlint | Conventional Commits | Validación automática |
| .gitattributes | GitHub | Normalización cross-platform |
