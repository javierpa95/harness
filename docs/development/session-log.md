# Session Log

Registro de sesiones de desarrollo. Cada entrada documenta que se hizo, que se decidio, y que se aprendio.

---

## [DATE] — [Titulo de la sesion]

### Que se hizo
- [tarea 1]
- [tarea 2]

### Decisiones tomadas
- [decision 1]: [razon]
- [decision 2]: [razon]

### Codigo modificado
- `path/to/file` — [que se cambio]

### Specs actualizadas
- `docs/features/feature.md` — status: [nuevo status]

### Proximos pasos
- [siguiente tarea 1]
- [siguiente tarea 2]

---

## 2026-08-25 — Agente `harness-arquitect` + fix de orden de permisos

### Que se hizo
- Creado agente primary `harness-arquitect` (meta-agente del propio harness): permisos completos con `.env*` denegado, mandato de consultar docs oficiales de OpenCode y documentar en `docs/harness/opencode-docs.md`
- Creada base de conocimiento `docs/harness/opencode-docs.md` (sembrada con la doc oficial de Permisos, verificada hoy)
- Corregido el orden de reglas de permisos en los 7 agentes granulares: catch-all `'*'` primero, especificas despues ("la ultima regla coincidente gana" — doc oficial)
- Actualizados ejemplos de `CREATING_AGENTS.md`, comentario de `opencode.jsonc`, tablas de agentes/routing de `AGENTS.md`, `HARNESS_SUMMARY.md`, CHANGELOG

### Decisiones tomadas
- `harness-arquitect` solo para OpenCode (sin mirror Claude Code): el modelo de permisos granulares es especifico de OC
- bash absoluto (`allow`) para harness-arquitect; `.env*` denegado tambien a nivel de agente para que el override por-agente no salte el deny global
- `default_agent` sigue siendo `project-architect`: los clones arrancan con su architect de producto

### Codigo modificado
- `.opencode/agents/harness-arquitect.md` — nuevo agente primary
- `.opencode/agents/{code-reviewer,docs-auditor,gdpr-auditor,release-manager,spec-writer,frontend-developer,backend-developer}.md` — reorder permission rules
- `.opencode/opencode.jsonc` — comentario actualizado
- `docs/harness/opencode-docs.md`, `agent-memory/harness-arquitect/MEMORY.md` — nuevos

### Specs actualizadas
- (ninguna — cambio de infraestructura del harness, no feature de producto)

### Proximos pasos
- Revisar y documentar https://opencode.ai/docs/es/agents/ y /rules/ en `opencode-docs.md`
- Considerar granularidad de bash en auditores (patrones con argumentos, p.ej. `'git tag *'`)
- Validar el flujo completo en un clon de prueba (`make init`)

---

_Registra cada sesion significativa. Si no hay nada nuevo, no crees entrada._
