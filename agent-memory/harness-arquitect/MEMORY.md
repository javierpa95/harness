# MEMORY.md — harness-arquitect

Memoria persistente del meta-agente. Leer ANTES de trabajar; actualizar AL TERMINAR cada sesion.

---

## Convenciones confirmadas

- Orden de reglas de permisos: catch-all `'*'` PRIMERO, especificas DESPUES (ultima coincidencia gana).
- Todo hallazgo de la doc oficial va a `docs/harness/opencode-docs.md` con URL + fecha.
- Cambios en `.opencode/**` requieren pensar siempre en el impacto en clones (init.sh/init.ps1 renombran architect y reescriben `default_agent`).
- `.codegraph/` va SIEMPRE en `.gitignore`: es indice local por worktree, nunca se comparte ni commitea.
- Flujo de merge preferido cuando las ramas divergen: traer master a la rama de trabajo, resolver conflictos AQUI, luego `git -C <worktree-principal> merge --ff-only`. El principal queda limpio y sin conflictos.
- Commits atomicos incluso en sesiones mixtas: separar fix vs feat aunque compartan sesion; docs compartidos (CHANGELOG, session-log) van con el commit principal del feat.

## Hallazgos

- **2026-08-25** — Doc de permisos (https://opencode.ai/docs/es/permissions/): "la ultima regla coincidente gana". Los 7 agentes granulares del template tenian `'*': 'deny'` al FINAL, anulando sus whitelist. Reordenado. CREATING_AGENTS.md corregido tambien.
- **2026-08-25** — Los permisos por-agente tienen prioridad sobre `opencode.jsonc`; por eso los primary con `edit: allow` pueden tocar `.opencode/**` pese al deny global. `.env*` se niega TAMBIEN a nivel de agente en harness-arquitect para que el override no la salte.

## Gotchas

- **PowerShell + `node -e`**: el escapado de comillas rompe scripts inline complejos. Escribir el script a archivo temporal (`C:\Users\javie\AppData\Local\Temp\opencode\`) y ejecutarlo por path.
- **Validar JSONC**: `JSON.parse` directo falla por comentarios; usar stripper que respete strings (ojo: emitir TAMBIEN la comilla de apertura al entrar en string). Validator util en `%TEMP%\opencode\validate-jsonc.js`.
- **`git grep --cached`** en esta version exige `--cached` antes de los argumentos no-opcion; alternativa robusta: `git diff --cached | Select-String`.
- **`git merge-tree --write-tree`**: previsualiza conflictos de un merge sin tocar el arbol. Usarlo SIEMPRE antes de mergear ramas divergidas.

---

_Ultima actualizacion: 2026-08-25_
