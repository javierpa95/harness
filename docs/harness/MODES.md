# Modos de permisos — AUTO vs SEGURO

El harness puede operar en dos modos que controlan cuándo OpenCode pide
supervision humana para ejecutar comandos (`bash`).

```bash
make mode              # ver el modo actual
make mode MODE=auto    # autonomo: todo allow salvo suelo anti-desastres
make mode MODE=seguro  # conservador: bash pregunta antes de ejecutar
```

Dentro del dashboard: tecla **m** alterna; el badge del header muestra el modo.
Tras cambiar de modo, reinicia OpenCode.

## Como funciona (modelo de herencia invertido)

- El nivel global de `bash` vive en un **bloque gestionado** dentro de
  `.opencode/opencode.jsonc` (marcado con `// harness:bash:start/end`).
  `make mode` reescribe SOLO ese bloque; comentarios y resto del fichero se
  preservan byte a byte.
- Los agentes **developer/spec-writer NO declaran bash**: heredan el global,
  asi que un interruptor los controla a todos.
- Los **auditores** (code-reviewer, gdpr-auditor, docs-auditor) y release-manager
  SI declaran su bash restrictivo propio (deny + whitelist git/grep): nunca
  preguntan y nunca ejecutan nada fuera de su lista, en cualquier modo.
- Los primary (architect, harness-arquitect) tienen bash allow por diseño.

## Suelo anti-desastres (activo tambien en AUTO)

| Patron | Por que |
|--------|---------|
| `rm -rf *` | borrado recursivo |
| `sudo *` | escalada de privilegios |
| `git push --force*` | reescritura de historial remoto |
| `git reset --hard*` | destruccion de cambios locales |

El suelo vive en el preset AUTO dentro de `harness.mjs` (`MODE_PRESETS`):
amplialo ahi si tu proyecto necesita mas guardas.

## Invariantes que ningun modo toca

- Lectura/edicion de `.env*`: denegada siempre, para todos los agentes.
- Ediciones fuera de las whitelists de cada agente: denegadas siempre.
- `pb_data`, bases de datos locales y `node_modules`: intocables.

## Para eximir a UN agente del modo global

Anade en su frontmatter un bloque `bash:` explicito (patrones con comodin, la
ultima regla coincidente gana). Vuelve a optar al global borrando el bloque.

## Verificacion

```bash
make doctor   # muestra modo activo y qué agentes aún preguntan
```
