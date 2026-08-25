---
name: harness-guide
description: Use when the user asks how to use this SDD agent harness, what agents or skills exist, which session commands are available, how agent memory works, how to change a subagent model, or how to start a new project from this template. Onboarding guide for new users.
---

# Harness Guide — Guia de Uso del Harness SDD

Eres la guia de onboarding de este proyecto. Explica al usuario, de forma clara y sin jerga innecesaria, como trabajar con este harness. Adapta el nivel de detalle: si pregunta algo puntual, responde puntual.

---

## Que es este harness (30 segundos)

Es un equipo de agentes IA coordinados por el flujo **SDD (Specification-Driven Development)**:

```
1. ANALYZE   -> El arquitecto analiza tu peticion (o entrevista si es compleja)
2. SPEC      -> spec-writer escribe la especificacion en docs/features/
3. IMPLEMENT -> frontend/backend-developer implementan (TDD en backend)
4. REVIEW    -> code-reviewer verifica (convenciones + spec) y docs-auditor la documentacion
5. DECIDE    -> El arquitecto aprueba (commit) o pide iteracion
```

Nada se implementa sin spec; nada se commitea sin review.

## Los agentes y para que sirve cada uno

| Agente | Cuando usarlo | Como invocarlo |
|--------|---------------|----------------|
| `[project]-architect` | Cualquier idea, feature o duda de diseno. Es el orquestador | Es el agente por defecto |
| `spec-writer` | "Escribe/actualiza la spec de X" | `@spec-writer` o via architect |
| `frontend-developer` | Implementar UI segun spec | Via architect |
| `backend-developer` | Implementar API/DB con TDD | Via architect |
| `code-reviewer` | "Revisa este codigo" | Via architect o directo |
| `gdpr-auditor` | "Hay riesgos de seguridad/privacidad?" | Directo con datos sensibles |
| `docs-auditor` | Verifica que los cambios tengan docs | Automatico antes de commit |
| `release-manager` | "Que falta para el release?" | `@release-manager` |
| `harness-arquitect` | Configurar/el harness mismo, dudas de OpenCode | `@harness-arquitect` |

**Tip**: no hace falta memorizar esto — habla con el arquitecto y el delega solo.

## Comandos de sesion

- `/start` — Al abrir OpenCode: muestra rama, ultimos commits, memoria de sesiones previas y salud del build.
- `/end` — Al terminar: guarda un resumen en `docs/development/session-log.md` para que la proxima sesion arranque con contexto.

## Skills disponibles (se cargan solas cuando hacen falta)

| Skill | Para que |
|-------|----------|
| `harness-guide` | Esta guia |
| `handoff` | Compactar una conversacion para pasarla a otro agente/sesion |
| `git-advisor` | Checklist antes de commit/push |
| `post-coding-check` | Verificacion rapida tras programar (build + secrets) |
| `security-guard` | Escaneo de credenciales en commits sensibles |
| `docs-maintainer` | Que docs actualizar tras tocar codigo |

## Memoria del proyecto

- Cada agente tiene su cuaderno: `agent-memory/<agente>/MEMORY.md` (patrones, bugs, convenciones aprendidas).
- El historial narrativo vive en `docs/development/session-log.md` (`/end` lo alimenta).
- Regla practica: **termina siempre con `/end`** — la siguiente sesion te lo agradecera.

## Permisos en 15 segundos

Los agentes tienen permisos distintos (definidos en `.opencode/agents/*.md` + `.opencode/opencode.jsonc`):

- Los developers solo editan su zona (frontend → `apps/web/`, backend → `services/backend/`).
- Los auditores son de solo lectura (solo escriben su propia memoria).
- Nadie lee ni edita archivos `.env`.
- Si algo pide aprobacion ("ask"), puedes responder **once** (solo ahora), **always** (el resto de la sesion) o rechazar.
- Los archivos `.env*` estan bloqueados para todos, incluido el arquitecto. Es deliberado.

## Trucos utiles (make)

```bash
make models                          # Agentes y su modelo configurado
make model AGENT=code-reviewer MODEL=anthropic/claude-sonnet-4-6   # Cambiar modelo
make model AGENT=code-reviewer MODEL=inherit                       # Volver a heredar
make tui                             # Menu interactivo del harness
make agents                          # Lista rapida
make check-secrets                   # Escaneo de secrets en staging
```

Tras cambiar un modelo, reinicia OpenCode para que aplique.

## Empezar un proyecto NUEVO desde este template

1. `make init` (o `./init.sh` / `.\init.ps1`) — renombra el arquitecto y configura placeholders.
2. Abre OpenCode; el agente leera `prompt.md` y terminara la configuracion (Paso 1-7 de AGENTS.md).
3. Define stack y estructura con tu arquitecto, crea `CONTEXT.md`, borra `prompt.md`.

## FAQ rapida

- **"Tengo una idea pero no se por donde empezar"** → Cuéntasela al arquitecto: hara grilling (entrevista) y luego arranca el flujo SDD.
- **"Por que me pide aprobacion para ejecutar X?"** → Permiso en modo ask. Responde always si confias en ese patron para la sesion.
- **"Quiero cambiar el modelo de un subagente"** → `make model AGENT=<nombre> MODEL=<provider/model>`.
- **"Esto del harness no funciona / quiero cambiar permisos"** → `@harness-arquitect`.
- **"Donde documento una decision importante?"** → La spec (docs/features/) y el commit; el git log es documentacion viva.

---

_Mantida por `harness-arquitect`. Si algo de esta guia queda obsoleto, actualizala en el mismo cambio._
