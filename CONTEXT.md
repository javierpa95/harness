# CONTEXT.md — Glosario de Dominio

Este documento define el **lenguaje compartido** del proyecto. Todos los agentes usan estos terminos exactos para evitar ambigüedades.

> **Regla**: Si un usuario usa un termino que entra en conflicto con este glosario, llámalo inmediatamente. "Tu glosario define 'X' como Y, pero parece que quieres decir Z — cual es?"

---

## Terminos del Proyecto

| Termino | Definicion | Ejemplo | No confundir con |
|---------|------------|---------|-------------------|
| [Termino] | [Definicion clara] | [Ejemplo concreto] | [Termino similar] |

---

## Enums / Status

### Status de Features
- `draft` — Spec en borrador, no implementar
- `approved` — Spec aprobada, lista para implementar
- `in-progress` — Implementacion en curso
- `done` — Implementada y verificada
- `deprecated` — Ya no aplica

### Status de Commits
- `feat` — Nueva funcionalidad
- `fix` — Bug fix
- `docs` — Documentacion
- `refactor` — Refactor sin cambio funcional
- `chore` — Mantenimiento
- `security` — Fix de seguridad

---

## Convenciones de Nombres

| Tipo | Convencion | Ejemplo |
|------|-----------|---------|
| Collections/Tablas | plural, ingles | `users`, `products` |
| Campos | snake_case | `created_at`, `user_id` |
| Migraciones | timestamp_descripcion | `1716000000_create_users` |
| Endpoints | kebab-case | `/api/user-profile` |
| Componentes | PascalCase | `UserProfile` |
| Funciones | camelCase | `getUserById` |
| Test files | `*.test.ext` | `user.service.test.ts` |

---

## Arquitectura

### Capas
- **Frontend** — UI, componentes, paginas (en `apps/web/`)
- **Backend** — API, logica, DB, auth (en `services/backend/`)
- **Shared** — Helpers, validators, tipos comunes

### Principios
- **SDD**: Spec antes de implementar
- **TDD**: Tests antes del codigo (backend/utils)
- **2 ejes de review**: Standards + Spec en paralelo

---

_Este documento evoluciona con el proyecto. Actualizalo cuando se resuelvan terminos nuevos._
