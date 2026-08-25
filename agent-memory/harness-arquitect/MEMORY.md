# MEMORY.md — harness-arquitect

Memoria persistente del meta-agente. Leer ANTES de trabajar; actualizar AL TERMINAR cada sesion.

---

## Convenciones confirmadas

- Orden de reglas de permisos: catch-all `'*'` PRIMERO, especificas DESPUES (ultima coincidencia gana).
- Todo hallazgo de la doc oficial va a `docs/harness/opencode-docs.md` con URL + fecha.
- Cambios en `.opencode/**` requieren pensar siempre en el impacto en clones (init.sh/init.ps1 renombran architect y reescriben `default_agent`).

## Hallazgos

- **2026-08-25** — Doc de permisos (https://opencode.ai/docs/es/permissions/): "la ultima regla coincidente gana". Los 7 agentes granulares del template tenian `'*': 'deny'` al FINAL, anulando sus whitelist. Reordenado. CREATING_AGENTS.md corregido tambien.
- **2026-08-25** — Los permisos por-agente tienen prioridad sobre `opencode.jsonc`; por eso los primary con `edit: allow` pueden tocar `.opencode/**` pese al deny global. `.env*` se niega TAMBIEN a nivel de agente en harness-arquitect para que el override no la salte.

## Gotchas

- (vacio — rellenar con el uso)

---

_Ultima actualizacion: 2026-08-25_
