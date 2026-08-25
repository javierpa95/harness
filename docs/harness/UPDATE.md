# Actualizar el harness en proyectos existentes

`make update` sincroniza los ficheros **que son del harness** desde un checkout
del template hacia un proyecto creado con versiones anteriores — sin tocar nunca
lo que es **del proyecto**.

```bash
# Vista previa (no escribe)
make update-dry TEMPLATE=C:\ruta\al\template

# Aplicar
make update TEMPLATE=C:\ruta\al\template
```

## Modelo mental: dos zonas

| Zona | Ejemplos | `make update` |
|------|----------|---------------|
| **Del harness** (generico) | `.opencode/agents|rules|skills|commands|scripts`, `init.sh/ps1`, `docs/harness/*.md` educativos | Se sincroniza |
| **Del proyecto** (tuyo) | `docs/BACKLOG.md`, specs, memoria de agentes, `Makefile`, `opencode.jsonc`, AGENTS.md, README... | NUNCA se toca |

La frontera completa y razonada se imprime al final de cada ejecucion (`NEVER
touched`) para que no haya sorpresas.

## Como decide que hacer con cada fichero

Manifiesto: `.opencode/harness-sync.json` (commitealo; guarda el hash que tenia
cada fichero en la ultima sincronizacion).

| Situacion | Accion |
|-----------|--------|
| No existe en el proyecto | **Instalar** |
| Identico al template | **Ya al dia** (nada) |
| Sin cambios locales desde la ultima sync | **Actualizar** (fast-forward) |
| Cambiado aqui Y tambien en el template | **Conflicto**: el template se deja en `<fichero>.new` para revision manual |

Los conflictos no se resuelven solos a proposito: si editaste un agente, esa
edicion es tuya. Compara, decide, borra el `.new`.

## Casos especiales resueltos

- **Arquitecto renombrado**: el template trae `project-architect.md`; el update
  lee `default_agent` del proyecto y lo mapea a `<tu>-architect.md` reescribiendo
  el frontmatter. El renombrado del init sobrevive a las actualizaciones.
- **`opencode.jsonc`**: contiene `default_agent` y permisos propios → jamas se
  sobrescribe. Si una version del template anade claves nuevas, se avisa en el
  reporte para merge manual.

## Limitaciones conocidas (backlog)

- Fuente = ruta local al checkout del template. Fuente git URL pendiente.
- `Makefile`: hibrido (comandos del proyecto) → fuera de la sync; copia a mano
  los targets nuevos que te interesen.
- `docs/harness/BACKLOG.md` no se sincroniza: es la evolucion LOCAL del harness
  en cada proyecto.
