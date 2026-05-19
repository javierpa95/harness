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

### 2. Iniciar sesion con el agente

Al abrir el proyecto con opencode, el agente ejecutara automaticamente el flujo de **Project Clarification** (ver `AGENTS.md`):

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
| `[project]-architect` | Arquitecto principal (piensa, planifica) | Siempre — punto de entrada |
| `frontend-guardian` | Analiza cambios en la capa UI | Si hay frontend |
| `backend-guardian` | Analiza cambios en API/DB/auth | Si hay backend |
| `gdpr-auditor` | Seguridad y privacidad basica | Si manejas datos de usuarios |
| `release-manager` | Versionado y releases | Si necesitas control de versiones |

### Flujo de trabajo

```
Usuario → [project]-architect (piensa y planifica)
              ↓
         Delega a guardians (analizan riesgos)
              ↓
         Presenta plan al usuario
              ↓
         Usuario aprueba → cambia a build → ejecuta cambios
```

### Comandos

| Comando | Funcion |
|---------|---------|
| `/start` | Carga contexto completo al inicio de sesion |
| `/end` | Persiste aprendizajes en `session-log.md` |

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

| Archivo | Plataforma |
|---------|------------|
| `Makefile` | Linux/Mac/Git Bash |
| `scripts/dev.ps1` | Windows PowerShell |

Ambos son templates — ajustar los comandos segun tu stack.

---

## License

Template libre para uso personal y comercial. Modifica lo que necesites.
