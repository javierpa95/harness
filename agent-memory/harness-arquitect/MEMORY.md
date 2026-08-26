# MEMORY.md — harness-arquitect

Memoria persistente del meta-agente. Leer ANTES de trabajar; actualizar AL TERMINAR cada sesion.

---

## Convenciones confirmadas

- Orden de reglas de permisos: catch-all `'*'` PRIMERO, especificas DESPUES (ultima coincidencia gana).
- Patrones bash: usar PARES `'cmd': allow` + `'cmd *': allow` (sin comodin solo coincide el comando exacto).
- NO declarar `read: 'allow'` en agentes: anula la red global (.env* etc.). read ya es allow por defecto.
- NO usar `tools:` en agentes: deprecado desde v1.1.1. `plan_enter`/`plan_exit` son claves muertas (no reconocidas).
- Skills: frontmatter SOLO name/description/license/compatibility/metadata; el resto se ignora silenciosamente.
- Todo hallazgo de la doc oficial va a `docs/harness/opencode-docs.md` con URL + fecha.
- Cambios en `.opencode/**` requieren pensar siempre en el impacto en clones (init.sh/init.ps1 renombran architect y reescriben `default_agent`; AMBOS lo hacen ahora).
- `.codegraph/` va SIEMPRE en `.gitignore`: es indice local por worktree, nunca se comparte ni commitea.
- Flujo de merge preferido cuando las ramas divergen: traer master a la rama de trabajo, resolver conflictos AQUI, luego `git -C <worktree-principal> merge --ff-only`. El principal queda limpio y sin conflictos.
- Commits atomicos incluso en sesiones mixtas: separar fix vs feat aunque compartan sesion; docs compartidos (CHANGELOG, session-log) van con el commit principal del feat.
- Makefile: recetas de una sola linea llamando node/scripts (cero sh-isms). make sin Git Bash en Windows cae a cmd.exe y `[ -z ... ]` revienta.
- Gestion de modelos de agentes: via `.opencode/scripts/harness.mjs` (`make models`, `make model AGENT=x MODEL=y|inherit`, `make tui`). Tras cambiar modelo, reiniciar OpenCode.

## Hallazgos

- **2026-08-25** — Doc de permisos (https://opencode.ai/docs/es/permissions/): "la ultima regla coincidente gana". Los 7 agentes granulares del template tenian `'*': 'deny'` al FINAL, anulando sus whitelist. Reordenado. CREATING_AGENTS.md corregido tambien.
- **2026-08-25** — Los permisos por-agente tienen prioridad sobre `opencode.jsonc`; por eso los primary con `edit: allow` pueden tocar `.opencode/**` pese al deny global. `.env*` se niega TAMBIEN a nivel de agente en los primary para que el override no la salte.
- **2026-08-25 (auditoria completa)** — C1: init.sh no actualizaba default_agent (fallback silencioso a build segun schema). A1-A3: memoria no escribible en 4 agentes, wildcards bash faltantes, read:allow anulando deny global de .env. M1-M5: tools deprecado x9, plan_enter/exit muertos, drift AGENTS.md-skills, invocation ignorado, commands sin description. TODO corregido (commits e4b9742..168775c). Cruft @opencode-ai/plugin eliminado; .opencode/.gitignore ahora commiteado (se auto-ignoraba antes).
- **2026-08-25 (dashboard v1)** — TUI v0 con readline NO funcionaba a traves de make (stdin sin TTY). v1: raw keypress + ANSI + guard `process.stdin.isTTY` con fallback a subcomandos. Gotcha critico: tras input cocinado (askLine) hay que reactivar enableRawMode() o el loop se congela. Caminos de evolucion del TUI valorados en docs/harness/BACKLOG.md (clack/Ink/web/plugin); decision actual: node raw sin deps para que los clones no necesiten npm install.
- **2026-08-25 (make update)** — Sincronizador harness-vs-proyecto (harness-update.mjs): whitelist + manifiesto de hashes (.opencode/harness-sync.json, commitear) clasifica install/update/current/conflict(.new). Mapeo del arquitecto via default_agent del jsonc del CLON. Agentes borrados por init se RESPETAN (RESTORE=1 reinstala). NUNCA tocar: jsonc, Makefile, AGENTS/CLAUDE/README, docs/* salvo harness educativos, agent-memory, backlogs. E2E con clon falso en %TEMP%\opencode\fake-clone. Gotchas propios: --target parseado pero no usado en v0 inicial; editar un bloque puede borrar declaraciones adyacentes (verificar con node --check SIEMPRE tras edits multiples).
- **2026-08-25 (doctor/auditoria)** — Motor compartido CLI+TUI: parsePermissionBlock (subset YAML indentado), globMatch y 5 checks. DOS lecciones: (1) reemplazos secuenciales de regex SE CONTAMINAN (el ?/* insertados por pasos previos los re-procesan pasos posteriores) → siempre single-pass con callback por token; (2) al testear checks contra YAML, la regex del propio check debe tolerar indentacion (/^\s*read:/). Metodologia que funciona: inyectar bug real → doctor debe AVISAR → git checkout revert → Todo limpio.
- **2026-08-25 (TUI visual)** — Desajuste del marco tenia 3 causas: linea desnuda sin bordes (un '' fuera de boxLine), tabs que desbordaban W, y boxLine con off-by-one (faltaba espacio antes del borde derecho: borders(2)+space+c+space=W). Reglas TUI que funcionan: cuerpo de ALTURA FIJA, redraw con \x1b[H + \x1b[K por linea (no 2J), cursor oculto salvo prompts (\x1b[?25l/h), alt-screen \x1b[?1049h/l para restaurar terminal al salir, y clamp ANSI-aware que degrada a texto plano. Tecnica de test sin TTY: extraer funciones puras del fuente via regex + new Function(scope) y asertar longitudes con contenido envenenado (status de 200 chars).
- **GOTCHA DE MEMORIA**: al anadir entradas nuevas a este fichero con Edit, NO usar como oldString la ultima entrada (se reemplaza en vez de anadir). Usar el separador '---' previo a _Ultima actualizacion_ como ancla, o oldString que incluya AMBAS (entrada vieja + entrada nueva concatenada). Ha pasado 2 veces hoy.

## Gotchas

- **PowerShell + `node -e`**: el escapado de comillas rompe scripts inline complejos. Escribir el script a archivo temporal (`C:\Users\javie\AppData\Local\Temp\opencode\`) y ejecutarlo por path.
- **Validar JSONC**: `JSON.parse` directo falla por comentarios; el stripper DEBE respetar strings o se come el `//` de `https://`. Validator en `%TEMP%\opencode\validate-jsonc.js` (tecnica: flag inStr/inEsc).
- **`git grep --cached`** en esta version exige `--cached` antes de los argumentos no-opcion; alternativa robusta: `git diff --cached | Select-String`.
- **`git merge-tree --write-tree`**: previsualiza conflictos de un merge sin tocar el arbol. Usarlo SIEMPRE antes de mergear ramas divergidas.
- **Select-String sobre *.md multi-archivo**: el output de Select-Object Name puede salir vacio por formato; usar ForEach-Object { $_.FullName } para listados fiables.

---

_Ultima actualizacion: 2026-08-25 (sesion auditoria + TUI/models + skill harness-guide)_
