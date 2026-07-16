# SDD Agent Harness — Template de Proyecto

Plantilla lista para iniciar cualquier proyecto de software con un **harness de agentes de IA** coordinando el desarrollo mediante **Specification-Driven Development (SDD)**.

**Stack:** Agnostico (configurable al iniciar proyecto)  
**Version:** 0.1.0

---

## ¿Que es esto?

Este template proporciona:

- **Agentes de IA especializados** que piensan, analizan y planifican antes de escribir codigo
- **Estructura de proyecto** probada para full-stack web apps
- **Reglas de desarrollo** que previenen errores comunes
- **Documentacion automatica** sincronizada con el codigo
- **Flujo de trabajo** que separa planificacion de ejecucion

---

## Quick Start

### 1. Copiar la plantilla

```bash
git clone <repo-url> my-project
cd my-project
```

### 2. Configurar el proyecto

Dos formas, elige una — hacen lo mismo, `init.sh` es el camino recomendado porque no depende de que el agente tenga permiso de editar `.opencode/`:

**Opcion A — script interactivo (recomendado):**

```bash
make init          # Linux/Mac/Git Bash, llama a init.sh
# o en PowerShell nativo sin Git Bash:
./init.ps1
```

Te pregunta nombre, descripcion, stack y tipo de proyecto; renombra `project-architect.md` al agente `[project]-architect` y actualiza `default_agent` en `.opencode/opencode.jsonc`.

**Opcion B — dejar que el agente lo haga:**

Al abrir el proyecto con opencode sin haber corrido `init.sh`, el agente ejecutara el flujo de **Project Clarification** (ver `AGENTS.md`):

1. Define el **nombre** y **descripcion** del proyecto
2. Elige el **stack** tecnologico (frontend, backend, database, deploy)
3. Decide la **estructura de carpetas** apropiada
4. Nombra al **agente arquitecto** principal
5. Configura los **agentes relevantes** para tu stack
6. Actualiza `AGENTS.md` con la info del proyecto

### 3. Empezar a desarrollar

Una vez configurado, usa `/start` para cargar contexto y empieza a construir.

---

## Agent Harness

| Agente | Funcion | Cuando usarlo |
|--------|---------|---------------|
| `[project]-architect` | Orquestador SDD (analiza, delega, decide) | Siempre — punto de entrada, `default_agent` |
| `spec-writer` | Escribe/actualiza feature specs en `docs/features/` | Siempre, antes de implementar (salvo cambio trivial) |
| `frontend-developer` | Implementa UI en `apps/web/`, sin TDD | Si hay frontend |
| `backend-developer` | Implementa API/DB/auth con TDD (Red→Green→Refactor) | Si hay backend |
| `code-reviewer` | Revisa la implementacion contra la spec, solo lectura | Cambios funcionales, antes de commit |
| `gdpr-auditor` | Busca credenciales expuestas y anti-patrones de seguridad | Si manejas datos de usuarios, en paralelo con code-reviewer |
| `release-manager` | Analiza el repo y recomienda versionado, no edita | Al preparar un release |

### Flujo de trabajo (SDD + TDD)

```
Usuario → project-architect analiza la peticion
              ↓
         spec-writer crea/actualiza la spec (docs/features/)
              ↓
         frontend-developer + backend-developer implementan
         (backend con TDD; en paralelo si aplica)
              ↓
         code-reviewer verifica contra la spec + tests
         (+ gdpr-auditor en paralelo si hay datos sensibles)
              ↓
         project-architect decide: PASS → commit | FAIL → itera
```

Detalle completo del flujo, excepciones (cambio trivial, bug fix) y criterios de decision en `AGENTS.md` y `.opencode/agents/project-architect.md`.

### Comandos y skills

| Comando | Funcion |
|---------|---------|
| `/start` | Carga contexto completo al inicio de sesion |
| `/end` | Persiste aprendizajes en `session-log.md` |

Los 4 skills en `.opencode/skills/` (`git-advisor`, `post-coding-check`, `security-guard`, `docs-maintainer`) no se disparan solos — cualquier agente los invoca por nombre con la tool `skill` cuando el contexto encaja (ver la `description` de cada uno).

---

## Estructura

```
apps/
  web/                    Frontend (ajustar nombre segun stack)

services/
  backend/                Backend (ajustar nombre segun stack)

docs/
  architecture/           Decisiones tecnicas, diagramas
  features/               Specs de funcionalidades
  legal/                  Privacidad, terminos
  development/            Memoria, session log, deuda tecnica

config/
  .env.example            Variables de entorno

.opencode/
  agents/                 Definiciones de agentes
  commands/               Comandos de sesion (/start, /end)
  rules/                  Reglas de desarrollo
  skills/                 Skills especializadas
```

---

## Configurar para tu stack

### Frontend

| Framework | Agente | Notas |
|-----------|--------|-------|
| Astro | `frontend-guardian` | Ajustar checklist en el agente |
| Next.js | `frontend-guardian` | Añadir checks de SSR/SSG |
| React/Vue/Svelte | `frontend-guardian` | Personalizar segun framework |
| Mobile (React Native) | `frontend-guardian` | Adaptar checks a mobile |
| Desktop (Tauri/Electron) | `frontend-guardian` | Añadir checks de seguridad nativa |

### Backend

| Tecnologia | Agente | Notas |
|------------|--------|-------|
| PocketBase | `backend-guardian` | Collections, rules, migraciones |
| Node/Express | `backend-guardian` | Routes, middleware, controllers |
| Python/FastAPI | `backend-guardian` | Endpoints, schemas, migrations |
| Supabase/Firebase | `backend-guardian` | Tablas, RLS, functions |
| Go/Rust | `backend-guardian` | Handlers, models, migrations |

### Para añadir un agente nuevo

1. Crear archivo `.md` en `.opencode/agents/`
2. Incluir frontmatter con `name`, `description`, `mode`, `permission`
3. Definir areas de expertise y checklist
4. Referenciarlo en `AGENTS.md` y en el arquitecto principal

### Para eliminar un agente

Borrar el archivo `.md` correspondiente en `.opencode/agents/` y actualizar `AGENTS.md`.

---

## Docker (opcional)

El template incluye configuracion Docker basica que puedes adaptar:

- `docker-compose.yml` — Servicios (ajustar segun stack)
- `.deploy/Dockerfile.web` — Build del frontend
- `.dockerignore` — Excluir archivos de la imagen

---

## CI/CD (opcional)

`.github/workflows/ci.yml` — Pipeline basico. Ajustar los comandos de build/test segun tu stack.

---

## Scripts

| Archivo | Plataforma | Uso |
|---------|------------|-----|
| `init.sh` | Linux/Mac/Git Bash | Setup interactivo inicial (via `make init`) |
| `init.ps1` | Windows PowerShell nativo | Lo mismo que `init.sh`, sin depender de bash |
| `Makefile` | Linux/Mac/Git Bash | `make help` para ver todos los comandos |
| `scripts/dev.ps1` | Windows PowerShell nativo | Equivalente a `make dev` |

Son templates — los comandos reales (`npm run dev`, `cd apps/web`, etc.) hay que ajustarlos al stack elegido tras el `init`.

---

## License

Template libre para uso personal y comercial. Modifica lo que necesites.
