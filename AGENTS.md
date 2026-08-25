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
- Tienda Marysol -> `store-architect`
- TaskFlow -> `taskflow-architect`
- MiBlog -> `blog-architect`

Renombra el archivo `.opencode/agents/project-architect.md` y actualiza su frontmatter.

### Paso 5: Configurar agentes relevantes

Elimina agentes que no apliquen al stack. Anade nuevos si es necesario.

| Agente template | Cuando usarlo |
|-----------------|---------------|
| `spec-writer` | Siempre — escribe feature specs |
| `frontend-developer` | Si hay frontend (web, mobile, desktop UI) |
| `backend-developer` | Si hay backend/API/database |
| `code-reviewer` | Siempre — revisa implementacion (2 ejes: Standards + Spec) |
| `gdpr-auditor` | Si manejas datos de usuarios |
| `release-manager` | Si necesitas versionado formal |

### Paso 6: Actualizar este archivo

Rellena los placeholders del header y las secciones siguientes con la info del proyecto.

### Paso 7: Crear CONTEXT.md

Crea `CONTEXT.md` en la raiz del proyecto con el glosario de dominio. Define los terminos clave que los agentes usaran.

---

## Flujo SDD + TDD — Specification-Driven Development

Este proyecto sigue el patron SDD. **Nada se implementa sin una spec. Nada se commitea sin review.**
Ademas, aplica **TDD (Test-Driven Development)** en backend y utils/shared.

### El Ciclo

```
1. ANALYZ    -> Architect analiza la peticion (o hace grilling si el plan es complejo)
2. SPEC      -> Spec Writer crea/actualiza la spec
3. IMPLEMENT -> Developers implementan (con TDD en backend/utils)
4. REVIEW    -> Code Reviewer verifica (2 ejes: Standards + Spec)
5. DECIDE    -> Architect: Pasa (commit) o itera?
```

### TDD — Donde aplica y donde no

| Capa | TDD | Por que |
|------|-----|---------|
| **Backend** (API, logica, DB, auth) | **SI** | Logica pura, facil de testear, alto valor |
| **Utils/Shared** (helpers, validators) | **SI** | Funciones puras, tests simples |
| **Frontend** (UI, componentes, paginas) | **NO** | Complejo de testear, menor ROI |

### TDD Cycle (Red -> Green -> Refactor)

```
1. RED     -> Escribe test que falla (comportamiento esperado)
2. GREEN   -> Escribe el minimo codigo para que pase
3. REFACTOR -> Mejora el codigo sin romper tests
4. REPITE  -> Siguiente comportamiento
```

### Reglas del Flujo

- **Spec primero**: No se escribe codigo sin una spec aprobada en `docs/features/`.
- **TDD en backend/utils**: Tests antes del codigo. Cada acceptance criteria de la spec se traduce en al menos un test.
- **Review obligatorio**: Todo cambio funcional pasa por code-reviewer (2 ejes). Solo se skippea en cambios triviales (texto, color, formateo).
- **Docs obligatorio**: Todo cambio funcional pasa por docs-auditor antes de commit. Si falta documentacion, se actualiza primero.
- **Paralelismo**: Frontend y backend se implementan en paralelo si ambos son necesarios.
- **Seguridad en paralelo**: Si hay datos sensibles, `code-reviewer` + `gdpr-auditor` corren simultaneamente.
- **Architect decide**: Solo el architect puede marcar una tarea como done o pedir iteracion.
- **Grilling**: Si el plan es complejo, el architect hace entrevista relajada antes del flujo SDD.

### Excepciones

| Caso | Flujo |
|------|-------|
| Cambio trivial (texto, color) | Analyze -> Implement -> Decide (skip spec + review) |
| Bug fix sin cambio de comportamiento | Analyze -> Implement -> Decide |
| Bug fix que cambia comportamiento | Flujo completo (spec obligatoria + tests) |
| Datos sensibles | Review + GDPR + Docs en paralelo |

---

## Commits — El Git Log es Documentacion

**El git log es la mejor documentacion de avance del proyecto.** Cada commit cuenta la historia de como evoluciono el codigo. Un historial limpio permite:

- Entender **por que** se tomo una decision sin leer docs
- Hacer `git blame` con contexto significativo
- Onboardear nuevos desarrolladores rapidamente
- Que nuevos agentes entiendan la evolucion del proyecto

### Formato de Commit

Conventional Commits: `type(scope): description`

| Type | Cuando | Ejemplo |
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
| Ideas o pendientes a futuro | `docs/BACKLOG.md` |

**REGLA**: Si un nuevo desarrollador no puede entender tu cambio leyendo la doc, la doc esta incompleta.

### Backlog del proyecto — docs/BACKLOG.md

El backlog es memoria de futuro: **toda idea, deuda tecnica o pendiente que no se trabaje AHORA se registra ahi**, con prioridad (🔥 alto / 🧊 medio / ❄️ algun dia). Reglas:

- El architect lo revisa al iniciar sesion (`/start`) y decide que se promueve a spec.
- Un item se trabaja cuando se convierte en spec en `docs/features/` (flujo SDD completo).
- Al completarse, se mueve a "Hecho" con fecha. Lo user-facing acaba en el CHANGELOG.
- Nadie borra items sin decidirlo explicitamente: se archivan, no desaparecen.

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

CONTEXT.md                Glosario de dominio (obligatorio)
ATTRIBUTION.md            Fuentes de ideas y patrones
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

1. **Entiende** el contexto leyendo AGENTS.md, CONTEXT.md y docs relevantes.
2. **Especifica** la feature en `docs/features/` (flujo SDD).
3. **Implementa** siguiendo la spec.
4. **Revisa** que la implementacion cumple la spec (2 ejes: Standards + Spec).
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
- [ ] Si el proyecto es en equipo: estas en una rama `feature/` o `fix/`, NO en `main` (ver `.opencode/rules/git-workflow.md` — en solitario, commits directos a `main` son aceptables)
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
| `[project]-architect` | Orquestador SDD (analiza, delega, decide, grilling) | `.opencode/agents/[project]-architect.md` |
| `spec-writer` | Escribe/actualiza feature specs | `.opencode/agents/spec-writer.md` |
| `frontend-developer` | Implementa frontend (UI) | `.opencode/agents/frontend-developer.md` |
| `backend-developer` | Implementa backend (API, DB, auth) | `.opencode/agents/backend-developer.md` |
| `code-reviewer` | Revisa implementacion (2 ejes: Standards + Spec) | `.opencode/agents/code-reviewer.md` |
| `gdpr-auditor` | Seguridad, privacidad basica | `.opencode/agents/gdpr-auditor.md` |
| `release-manager` | Versionado, releases, changelog | `.opencode/agents/release-manager.md` |
| `docs-auditor` | Verifica que cambios de codigo actualizan docs | `.opencode/agents/docs-auditor.md` |
| `harness-arquitect` | Meta-arquitecto: configura y evoluciona el propio harness (permisos, agentes, skills, docs OpenCode) | `.opencode/agents/harness-arquitect.md` |

### Skills

| Skill | Uso | Archivo |
|-------|-----|---------|
| `harness-guide` | Guia de onboarding: como usar el harness | `.opencode/skills/harness-guide/SKILL.md` |
| `handoff` | Transferir contexto a otro agente | `.opencode/skills/handoff/SKILL.md` |
| `git-advisor` | Checklist antes de commit/push | `.opencode/skills/git-advisor/SKILL.md` |
| `post-coding-check` | Verificacion rapida tras programar | `.opencode/skills/post-coding-check/SKILL.md` |
| `security-guard` | Escaneo de credenciales pre-commit | `.opencode/skills/security-guard/SKILL.md` |
| `docs-maintainer` | Que docs actualizar tras tocar codigo | `.opencode/skills/docs-maintainer/SKILL.md` |

### Herramientas del Harness (make / scripts)

| Comando | Uso |
|---------|-----|
| `make models` | Lista agentes y su modelo configurado |
| `make model AGENT=x MODEL=y` | Cambia el modelo de un agente (`MODEL=inherit` para heredar) |
| `make tui` | Menu interactivo del harness (v0) |
| `.opencode/scripts/harness.mjs` | CLI subyacente (`models`, `model`, `skills`, `tui`) |

### Tabla de Routing (cuando usar cada agente/skill)

| El usuario dice... | Usa... |
|-------------------|--------|
| "Quiero implementar X" | `project-architect` (flujo SDD) |
| "Tengo una idea" / "Que te parece esto" | `project-architect` (modo grilling) |
| "Configura/adapta el harness" o dudas de OpenCode/permisos | `harness-arquitect` |
| "Como uso el harness? / Que puedo hacer?" | Skill `harness-guide` (cualquier agente) |
| "Revisa este codigo" | `code-reviewer` |
| "Que falta para el release?" | `release-manager` |
| "Hay problemas de seguridad?" | `gdpr-auditor` |
| "Escribe la spec de X" | `spec-writer` |
| "Esto para mas adelante" / "apuntalo" | Registrar en `docs/BACKLOG.md` |
| "Necesito que otro agente continue esto" | `handoff` |

### Comandos de Sesion

| Comando | Uso | Archivo |
|---------|-----|---------|
| `/start` | Carga contexto completo al inicio de sesion | `.opencode/commands/start.md` |
| `/end` | Persiste aprendizajes en `session-log.md` | `.opencode/commands/end.md` |

---

_Este documento evoluciona con el proyecto. Si algo no esta claro, pregunta._
