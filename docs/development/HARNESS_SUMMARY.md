# SDD Agent Harness — Resumen Completo

**Version:** 0.1.0
**Fecha:** 21 julio 2026
**Autor:** Javier (Endocrinotech)

---

## Qué es esto

Un **template de proyecto** para desarrollo asistido por agentes de IA. No es solo una lista de agentes — es un **sistema conectado** donde el architect obliga a pasar por spec, review, y docs antes de commit.

**Filosofía:** Separar la especificación (QUÉ) de la ejecución (CÓMO). Los agentes leen spec files y deciden cómo implementar.

---

## Arquitectura del Sistema

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

## Qué tiene el harness

### Agentes (8 total)

| Agente | Plataforma | Rol |
|--------|-----------|-----|
| **project-architect** | OpenCode (primary) / CLAUDE.md (CC) | Orquestador SDD, decide |
| **spec-writer** | Ambas | Escribe specs en `docs/features/` |
| **frontend-developer** | Ambas | Implementa UI (sin TDD) |
| **backend-developer** | Ambas | Implementa API/DB con TDD |
| **code-reviewer** | Ambas | Review en 2 ejes (Standards + Spec) |
| **docs-auditor** | Ambas | Verifica que cambios actualizan docs |
| **gdpr-auditor** | Ambas | Auditoría de seguridad/privacidad |
| **release-manager** | Ambas | Versionado y releases |

### Flujo SDD (6 pasos)

```
1. ANALYZE  → Architect analiza la petición
2. SPEC     → Spec-writer crea/actualiza spec
3. IMPLEMENT → Developers implementan (TDD en backend)
4. REVIEW   → Code-reviewer verifica (2 ejes paralelos)
5. DOCS     → Docs-auditor verifica documentación
6. DECIDE   → Architect: PASS (commit) o FAIL (iterar)
```

**Regla:** No hay commit sin paso 5 (docs-auditor).

### Plataformas Soportadas

| Plataforma | Config | Architect |
|-----------|--------|-----------|
| **Claude Code** | `.claude/` | `CLAUDE.md` (system prompt) |
| **OpenCode** | `.opencode/` | `project-architect.md` (mode: primary) |

### MCP Servers (3 integrados)

| MCP | Tipo | Què hace | Estado |
|-----|------|----------|--------|
| **CodeGraph** | Local (npx) | Graph del codebase (simbolos, call paths, blast radius) | Deshabilitado por defecto |
| **Context7** | Remote (HTTPS) | Busca docs de cualquier libreria/framework | Deshabilitado por defecto |
| **Engram** | Local (npx) | Memoria persistente entre sesiones | Deshabilitado por defecto |

Config en: `.opencode/opencode.jsonc` y `.claude/settings.json`.

> **Importante:** Cada MCP anade tokens al contexto del LLM. Solo activa los que necesites.

### Memoria Agnóstica (shared)

```
agent-memory/
├── code-reviewer/MEMORY.md
├── gdpr-auditor/MEMORY.md
├── backend-developer/MEMORY.md
└── docs-auditor/MEMORY.md
```

Compartida entre plataformas. Ambos agentes leen/escriben en la misma ubicación.

### Git Hooks (Husky)

| Hook | Qué hace |
|------|----------|
| `pre-commit` | Detecta secrets, advierte console.log |
| `commit-msg` | Valida conventional commits |

### CI/CD (GitHub Actions)

| Pipeline | Estado | Qué incluye |
|----------|--------|-------------|
| Basic | Desconectado | lint, typecheck, test, commitlint |
| Advanced | Desconectado | + security, coverage, Docker, docs |

Activar con: `make ci-enable-basic` o `make ci-enable-advanced`

### Hooks de Seguridad (Claude Code)

| Evento | Qué hace |
|--------|----------|
| PreToolUse Bash | Bloquea `rm -rf`, `git push --force` |
| PostToolUse Write(*.py) | Valida sintaxis Python |
| PostToolUse Write(*.ts) | Valida TypeScript |
| Stop | Log de actividad |

### Templates de Docs

```
docs/
├── architecture/
│   ├── system_overview.md    ← Arquitectura general
│   └── deployment.md         ← Guía de deploy
├── features/
│   └── _template.md          ← Template de spec
├── development/
│   ├── session-log.md        ← Log de sesiones
│   └── agent_memory.md       ← Memoria de agentes
├── legal/
│   └── privacy_policy.md     ← Política de privacidad
└── CHANGELOG.md              ← Keep a Changelog
```

### Design System

| Archivo | Para qué |
|---------|----------|
| `DESIGN.md.template` | Tokens de diseño visual (colores, tipografía) |
| `CODING_STANDARDS.md.template` | Convenciones de código |

**Referencias disponibles:** Material, Apple, Ant, Shadcn, Tailwind, Vercel, Linear, Notion, Spotify (142+ en Open Design)

### Makefile (30+ comandos)

```bash
make help              # Ver todos los comandos
make init              # Auto-configuración interactiva
make check             # Lint + typecheck + test
make review            # Code review en 2 ejes
make audit             # GDPR audit
make agents            # Ver agentes disponibles
make memory            # Ver memoria de agentes
make hooks             # Ver hooks activos
make ci-status         # Estado de CI
make ci-enable-basic   # Activar CI básica
make design-lint       # Validar DESIGN.md
make design-ref        # Ver sistemas de referencia
```

### Auto-Configuración (init.sh)

```bash
make init
```

Pregunta:
1. Nombre del proyecto
2. Tipo (web-app, api, full-stack, etc.)
3. Stack (frontend, backend, database, deploy)
4. Design system (Material, Apple, Shadcn, etc.)
5. Coding standards (full, minimal, skip)

Después:
- Instala npm dependencies (husky, commitlint)
- Configura git hooks
- Rellena placeholders en AGENTS.md, CLAUDE.md, README.md
- Renombra architect agents
- Crea DESIGN.md y CODING_STANDARDS.md
- Genera prompt.md para que el agente termine

---

## Estructura del Repo

```
harness/
├── .opencode/agents/          ← 7 agentes (OpenCode)
│   ├── project-architect.md
│   ├── spec-writer.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   ├── code-reviewer.md
│   ├── docs-auditor.md
│   ├── gdpr-auditor.md
│   └── release-manager.md
│
├── .claude/                   ← Config Claude Code
│   ├── agents/                ← 6 subagentes
│   ├── commands/              ← /start, /end
│   ├── skills/                ← hooks-and-memory
│   ├── settings.json          ← Hooks de seguridad + MCP
│   └── tools.md               ← Herramientas MCP (opcional)
│
├── agent-memory/              ← Memoria compartida
│   ├── code-reviewer/
│   ├── gdpr-auditor/
│   ├── backend-developer/
│   └── docs-auditor/
│
├── .husky/                    ← Git hooks
│   ├── pre-commit
│   └── commit-msg
│
├── .github/workflows/         ← CI/CD
│   ├── ci-basic.yml.disabled
│   └── ci-advanced.yml.disabled
│
├── docs/                      ← Templates de documentación
│   ├── architecture/
│   ├── features/
│   ├── development/
│   ├── legal/
│   ├── harness/                ← Docs educativas del harness
│   │   ├── MCP-integration.md
│   │   ├── agents-patterns.md
│   │   └── sdd-advanced.md
│   └── CHANGELOG.md
│
├── CLAUDE.md                  ← Contexto Claude Code
├── AGENTS.md                  ← Contexto OpenCode
├── CONTEXT.md                 ← Glosario de dominio
├── ATTRIBUTION.md             ← Fuentes y patrones
├── DESIGN.md.template         ← Tokens de diseño
├── CODING_STANDARDS.md.template ← Convenciones de código
├── Makefile                   ← 30+ comandos
├── init.sh                    ← Auto-configuración
├── package.json               ← Husky + commitlint
├── commitlint.config.js       ← Reglas de commits
├── .gitattributes             ← Normalización line endings
├── .gitignore                 ← Exclusiones
└── docker-compose.yml         ← Template Docker
```

---

## Qué se inspira en qué

| Idea | Fuente | Link |
|------|--------|------|
| Code review 2 ejes | Matt Pocock | github.com/mattpocock/skills |
| Grilling mode | Matt Pocock | skills/productivity/grilling |
| Handoff skill | Matt Pocock | skills/productivity/handoff |
| Context.md glosario | Matt Pocock | skills/engineering/domain-modeling |
| DESIGN.md tokens | Google | github.com/google-labs-code/design.md |
| Design systems ref | Open Design | github.com/nexu-io/open-design |
| Conventional Commits | Angular/Google | conventionalcommits.org |
| Husky + commitlint | Typicode | typicode.github.io/husky |

Ver `ATTRIBUTION.md` para documentación completa.

---

## Lo que FALTA (mejoras sugeridas)

### Prioridad Alta (para arrancar un proyecto real)

| Qué | Por qué | Esfuerzo |
|-----|---------|----------|
| **Tests de ejemplo** | Un `tests/` con pytest o jest para que el developer tenga base | 30 min |
| **Spec de ejemplo** | Un `docs/features/_example.md` muestre cómo llenar una spec | 20 min |
| **Ejemplo de MEMORY.md** | Ejemplos reales de lo que guardan los agentes | 15 min |

### Prioridad Media (para pulir)

| Qué | Por qué | Esfuerzo |
|-----|---------|----------|
| **docker-compose.yml funcional** | El actual tiene placeholders | 30 min |
| **.env.example completo** | Template de variables de entorno reales | 15 min |
| **PR template** | `.github/pull_request_template.md` | 10 min |
| **Issue templates** | `.github/ISSUE_TEMPLATE/` | 15 min |

### Prioridad Baja (para equipo/publicación)

| Qué | Por qué | Esfuerzo |
|-----|---------|----------|
| **README bonito** | El actual es funcional pero no vende | 1 hora |
| **Demo / screenshot** | Para entender el harness en 30 segundos | 2 horas |
| **Video walkthrough** | GIF o video corto | 3 horas |
| **Branch protection rules** | Para GitHub (requiere review, CI) | 15 min |

### Muy baja (nice to have)

| Qué | Por qué | Esfuerzo |
|-----|---------|----------|
| **Landing page** | Para vender el harness | 1 día |
| **Playground online** | Probar el harness sin clonar | 2 días |
| **Integración con Vercel/Railway** | Deploy automático | 1 hora |

---

## Cómo usar este harness

### 1. Clonar

```bash
git clone https://github.com/javierpa95/harness.git mi-proyecto
cd mi-proyecto
```

### 2. Configurar

```bash
make init
```

### 3. Desarrollar

```bash
# En OpenCode o Claude Code
# El architect guía el flujo SDD
```

### 4. Comandos útiles

```bash
make help              # Ver todo
make check             # Calidad
make review            # Code review
make memory            # Ver memoria
```

---

## Commits de esta sesión

1. `4016060` — Matt Pocock patterns (2-axis review, grilling, handoff)
2. `a82e72e` — Claude Code mirror (.claude/ structure)
3. `84ba8b4` — ATTRIBUTION.md
4. `1f2467a` — CREATING_AGENTS.md
5. `a76c839` — Hooks + Memoria
6. `d95eac8` — Memoria agnóstica
7. `a9582d4` — Makefile mejorado
8. `9c01973` — Docs auditor + templates
9. `61b0d1e` — Git hooks + commitlint
10. `246dc58` — init.sh auto-configuración
11. `49ad3c6` — Architect corregido (CLAUDE.md)
12. `b5de1df` — CI/CD básico
13. `36ea140` — CI básica y avanzada
14. `c67b376` — DESIGN.md + CODING_STANDARDS.md

---

_Resumen generado el 21 julio 2026._
