# AGENTS.md — Template de Proyecto (SDD Agent Harness)

**Proyecto:** [PROJECT_NAME] — [ONE_LINE_DESCRIPTION]  
**Stack:** [STACK_TECH]  
**Version:** 0.1.0  
**Ultima actualizacion:** [DATE]

---

## Project Clarification — Primer Paso Obligatorio

> **Cuando se inicia un proyecto nuevo desde esta plantilla, el agente DEBE ejecutar este flujo antes de escribir codigo.**

### Paso 1: Identificar el proyecto

Pregunta al usuario y define:

| Pregunta | Ejemplo |
|----------|---------|
| **Nombre del proyecto** | `mi-tienda`, `taskflow`, `blog-dev` |
| **Descripcion en 1 linea** | "Tienda online de productos artesanales" |
| **Tipo de proyecto** | Web app, API, CLI, Mobile, Desktop, Full-stack |
| **Idioma de la UI** | Espanol, Ingles, Multi-idioma |

### Paso 2: Definir el stack

| Pregunta | Ejemplo |
|----------|---------|
| **Frontend** | Astro, Next.js, React, Vue, Svelte, None |
| **Backend** | PocketBase, Node/Express, Python/FastAPI, Supabase, None |
| **Database** | SQLite, PostgreSQL, MongoDB, None |
| **Deploy** | Coolify, Vercel, Railway, Docker, Manual |
| **Otros** | Auth provider, payment gateway, etc. |

### Paso 3: Decidir estructura de carpetas

Basandote en el stack, propone una estructura. Patrones comunes:

```
# Full-stack web
apps/
  web/                    Frontend
services/
  backend/                Backend + DB

# Monorepo multiple apps
apps/
  web/
  admin/
  api/
packages/
  shared/
  ui/

# Single app (simple)
src/
  components/
  pages/
  services/
  utils/
```

### Paso 4: Nombrar el agente arquitecto

El arquitecto principal se nombra como `[project]-architect`. Ejemplos:
- Tienda Marysol → `store-architect`
- TaskFlow → `taskflow-architect`
- MiBlog → `blog-architect`

Renombra el archivo `.opencode/agents/project-architect.md` y actualiza su frontmatter.

### Paso 5: Configurar agentes relevantes

Elimina agentes que no apliquen al stack. Añade nuevos si es necesario.

| Agente template | Cuando usarlo |
|-----------------|---------------|
| `spec-writer` | Siempre — escribe feature specs |
| `frontend-developer` | Si hay frontend (web, mobile, desktop UI) |
| `backend-developer` | Si hay backend/API/database |
| `code-reviewer` | Siempre — revisa implementacion contra spec |
| `gdpr-auditor` | Si manejas datos de usuarios |
| `release-manager` | Si necesitas versionado formal |

### Paso 6: Actualizar este archivo

Rellena los placeholders del header y las secciones siguientes con la info del proyecto.

---

## Flujo SDD + TDD — Specification-Driven Development

Este proyecto sigue el patron SDD. **Nada se implementa sin una spec. Nada se commitea sin review.**
Ademas, aplica **TDD (Test-Driven Development)** en backend y utils/shared.

### El Ciclo

```
1. ANALYZ    → Architect analiza la peticion
2. SPEC      → Spec Writer crea/actualiza la spec
3. IMPLEMENT → Developers implementan (con TDD en backend/utils)
4. REVIEW    → Code Reviewer verifica contra la spec + tests
5. DECIDE    → Architect: ¿Pasa (commit) o itera?
```

### TDD — Donde aplica y donde no

| Capa | TDD | Por que |
|------|-----|---------|
| **Backend** (API, logica, DB, auth) | **SI** | Logica pura, facil de testear, alto valor |
| **Utils/Shared** (helpers, validators) | **SI** | Funciones puras, tests simples |
| **Frontend** (UI, componentes, paginas) | **NO** | Complejo de testear, menor ROI |

### TDD Cycle (Red → Green → Refactor)

```
1. RED     → Escribe test que falla (comportamiento esperado)
2. GREEN   → Escribe el minimo codigo para que pase
3. REFACTOR → Mejora el codigo sin romper tests
4. REPITE  → Siguiente comportamiento
```

### Reglas del Flujo

- **Spec primero**: No se escribe codigo sin una spec aprobada en `docs/features/`.
- **TDD en backend/utils**: Tests antes del codigo. Cada acceptance criteria de la spec se traduce en al menos un test.
- **Review obligatorio**: Todo cambio funcional pasa por code-reviewer. Solo se skippea en cambios triviales (texto, color, formateo).
- **Paralelismo**: Frontend y backend se implementan en paralelo si ambos son necesarios.
- **Seguridad en paralelo**: Si hay datos sensibles, `code-reviewer` + `gdpr-auditor` corren simultaneamente.
- **Architect decide**: Solo el architect puede marcar una tarea como done o pedir iteracion.

### Excepciones

| Caso | Flujo |
|------|-------|
| Cambio trivial (texto, color) | Analyze → Implement → Decide (skip spec + review) |
| Bug fix sin cambio de comportamiento | Analyze → Implement → Decide |
| Bug fix que cambia comportamiento | Flujo completo (spec obligatoria + tests) |
| Datos sensibles | Review + GDPR audit en paralelo |

---

## Commits — El Git Log es Documentacion

**El git log es la mejor documentacion de avance del proyecto.** Cada commit cuenta la historia de como evoluciono el codigo. Un historial limpio permite:

- Entender **por que** se tomo una decision sin leer docs
- Hacer `git blame` con contexto significativo
- Onboardear nuevos desarrolladores rapidamente
- Que nuevos agentes entiendan la evolucion del proyecto

### Formato de Commit

Conventional Commits: `type(scope): description`

| Type | Cuándo | Ejemplo |
|------|--------|---------|
| `feat` | Nueva funcionalidad | `feat(auth): add login page and session management` |
| `fix` | Bug fix | `fix(products): handle empty product list in catalog` |
| `docs` | Documentacion | `docs: update deployment guide for Coolify` |
| `refactor` | Refactor sin cambio funcional | `refactor(web): extract product card component` |
| `chore` | Mantenimiento | `chore: update dependencies` |
| `security` | Fix de seguridad | `security: add rate limiting to auth endpoint` |

### Reglas de Commit

1. **Atomicos**: Un cambio = un commit. No mezcles features.
2. **En ingles**: Mensajes siempre en ingles.
3. **Descriptivos**: Cualquiera debe entender que hizo el commit sin ver el diff.
4. **Build antes de commit**: Verifica que el build pasa.
5. **Scope entre parentesis**: Indica que area afecta (`web`, `backend`, `deploy`, `docs`).

---

## Documentacion — docs/ para Nuevos Desarrolladores

Aunque el git log documenta el avance, la carpeta `docs/` existe para que **nuevos desarrolladores y agentes** entiendan el proyecto rapidamente.

| Si modificas... | Debes actualizar... |
|-----------------|---------------------|
| Frontend (UI, paginas, componentes) | `docs/features/*.md`, `docs/architecture/system_overview.md` |
| Backend (API, DB, auth, reglas) | `docs/architecture/system_overview.md`, `docs/features/*.md` |
| Config, deploy, CI/CD | `docs/architecture/deployment.md` |
| Politicas legales | `docs/legal/*.md` |
| Cualquier cambio user-facing | `docs/CHANGELOG.md` (seccion `[Unreleased]`) |

**REGLA**: Si un nuevo desarrollador no puede entender tu cambio leyendo la doc, la doc esta incompleta.

---

## Filosofia de Trabajo

- **Planifica antes de ejecutar:** Propone un plan antes de cambios significativos (>3 archivos o >50 lineas).
- **Haz preguntas:** Si algo no esta claro, pregunta antes de asumir.
- **Menos es mas:** Prefiere cambios pequenos y verificables sobre refactorizaciones masivas.
- **No rompas lo que funciona:** Si cambias una API, interface o contrato, actualiza TODOS los consumidores.
- **El codigo se escribe en ingles, los comentarios en ingles, el contenido UI en el idioma del proyecto.**

---

## Estructura del Proyecto

> Esta es la estructura sugerida. Adapte al stack del proyecto.

```
apps/
  web/                    Frontend (ajustar nombre segun stack)

services/
  backend/                Backend (ajustar nombre segun stack)

docs/
  architecture/           Decisiones tecnicas, diagramas
  features/               Specs de funcionalidades (SDD)
  legal/                  Privacidad, terminos
  development/            Memoria, session log, deuda tecnica

config/
  .env.example            Variables de entorno
```

---

## Seguridad

- **NUNCA** hardcodees credenciales, passwords, tokens o URLs de produccion.
- **NUNCA** comitees archivos `.env`, `node_modules`, o directorios de datos locales.
- **SIEMPRE** usa variables de entorno para configuracion sensible.
- **SIEMPRE** valida inputs en endpoints y formularios.
- **SIEMPRE** protege rutas de admin con autenticacion.

---

## Proceso de Desarrollo

1. **Entiende** el contexto leyendo AGENTS.md y docs relevantes.
2. **Especifica** la feature en `docs/features/` (flujo SDD).
3. **Implementa** siguiendo la spec.
4. **Revisa** que la implementacion cumple la spec.
5. **Commitea** con mensaje claro y atomico.
6. **Documenta** si has tocado codigo de la app.
7. **Registra** hallazgos en `docs/development/agent_memory.md`.

---

## Convenciones por Stack

> Completa esta seccion con las convenciones del stack elegido.

### Frontend

- Components: **PascalCase**
- Pages/Routes: kebab-case
- Utils/Services: **camelCase**
- Usa TypeScript estricto (no `any` sin justificacion).
- No uses `console.log` en produccion.
- Las rutas de admin van bajo `/admin/*` y estan protegidas por auth.

### Backend

- Migraciones: timestamp + nombre descriptivo.
- API rules: documenta que rol puede hacer que.
- No hardcodees admin users en migraciones o seeds.
- Nombres de tablas/collections en plural y en ingles.

---

## Contratos de Datos

> Documenta aqui las collections, tablas, interfaces o schemas principales.

| Entidad | Campos principales | Acceso publico |
|---------|-------------------|----------------|
| [entity] | field1, field2, ... | Read/Write/None |

### Enums / Status

> Documenta los posibles valores de status, roles, etc.

---

## Verificacion Antes de Commits

Antes de sugerir un `git commit`, asegurate de:

- [ ] No hay credenciales hardcodeadas
- [ ] No hay `console.log` de datos sensibles
- [ ] No has anadido archivos que deberian estar en `.gitignore`
- [ ] El build funciona (`npm run build` o equivalente)
- [ ] Si es un cambio user-facing: actualizaste `docs/CHANGELOG.md`
- [ ] Estas en una rama `feature/` o `fix/`, NO en `main`
- [ ] Los mensajes de commit siguen Conventional Commits

---

## Prohibiciones Absolutas

1. No crear carpetas en la raiz sin consenso.
2. No instalar dependencias globales sin documentarlas.
3. No cambiar la version de runtime (Node, Python, etc.) sin avisar.
4. No comitear archivos `.env` o datos locales.
5. No desactivar autenticacion "temporalmente para probar".
6. No implementar sin spec (excepto cambios triviales).
7. No commitear sin review (excepto cambios triviales).

---

## Agent Harness

El proyecto usa un harness de agentes de IA para coordinar el desarrollo mediante SDD:

| Agente | Dominio | Archivo |
|--------|---------|---------|
| `[project]-architect` | Orquestador SDD (analiza, delega, decide) | `.opencode/agents/[project]-architect.md` |
| `spec-writer` | Escribe/actualiza feature specs | `.opencode/agents/spec-writer.md` |
| `frontend-developer` | Implementa frontend (UI) | `.opencode/agents/frontend-developer.md` |
| `backend-developer` | Implementa backend (API, DB, auth) | `.opencode/agents/backend-developer.md` |
| `code-reviewer` | Revisa implementacion contra spec | `.opencode/agents/code-reviewer.md` |
| `gdpr-auditor` | Seguridad, privacidad basica | `.opencode/agents/gdpr-auditor.md` |
| `release-manager` | Versionado, releases, changelog | `.opencode/agents/release-manager.md` |

### Comandos de Sesion

| Comando | Uso | Archivo |
|---------|-----|---------|
| `/start` | Carga contexto completo al inicio de sesion | `.opencode/commands/start.md` |
| `/end` | Persiste aprendizajes en `session-log.md` | `.opencode/commands/end.md` |

---

_Este documento evoluciona con el proyecto. Si algo no esta claro, pregunta._
