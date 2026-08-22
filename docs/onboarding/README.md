# Manual del Harness — Índice

Bienvenido. Este libro documenta **el harness de opencode** del proyecto: el sistema de agentes que dirige el desarrollo. Funciona como **onboarding** para gente nueva y como **referencia** para quien ya trabaja con él.

> **¿Sos nuevo y tenés dudas?** Empezá por el capítulo 01. No hace falta leer todo de corrido — el índice te dice qué leer según lo que necesitás.

## Cómo usar este libro

- Es un **libro vivo**: los capítulos se agregan y se amplían a medida que evoluciona el harness.
- Cada capítulo es independiente y **arranca con la respuesta** (qué decidimos/qué sabés después de leerlo). Los detalles van después.
- Usá el índice para navegar. Podés leerlo todo, o ir directo al capítulo que resol una duda.

## Recorridos recomendados

| Si sos... | Leé |
|-----------|-----|
| **Nivel cero** — nunca usaste opencode/agentes | Cap 1 → Cap 2 → Cap 3 |
| **Con experiencia** — ya venís de otros agentes (Claude Code, Cursor, etc.) | Cap 2 y Cap 3; consultá el 1 solo para glosario |
| **Tenés una duda puntual** (¿qué es un permiso? ¿cómo agrego un MCP?) | Buscá el capítulo/tema en el índice |
| **Querés contribuir** a evolucionar el harness | Cap 3 + `docs/architecture/system_overview.md` |

## Índice de capítulos

| # | Capítulo | Nivel | Estado |
|---|----------|-------|--------|
| 01 | [Conceptos básicos](01-conceptos-basicos.md) — qué es opencode, el harness, los agentes, MCP, spec | Nivel 0 | ✔ |
| 02 | [El flujo SDD](02-flujo-sdd.md) — el ciclo ANALYZE → SPEC → IMPLEMENT → REVIEW → DECIDE | Nivel 0 | ✔ |
| 03 | [El harness en la práctica](03-harness-en-practica.md) — cómo trabajar día a día, comandos, dónde vive cada cosa | Nivel 0 | ✔ |
| 04 | [Configuración y permisos](04-configuracion-permisos.md) — opencode.json, merge de configs, permisos granulares | Avanzado | 🔨 en desarrollo |
| 05 | [Crear y editar agentes](05-crear-editar-agentes.md) — frontmatter, modo primario/subagente, delegación | Avanzado | ⏳ planificado |
| 06 | [MCP servers](06-servidores-mcp.md) — qué son, cómo agregar/desactivar, servidores del template | Avanzado | ⏳ planificado |
| 07 | [Mantenimiento del harness](07-mantenimiento-harness.md) — limpiar duplicados, validar config, troubleshooting | Avanzado | ⏳ planificado |

**Leyenda de estado:** ✔ publicado · 🔨 en desarrollo · ⏳ planificado

## Glosario rápido (nivel 0)

| Término | En una línea |
|---------|--------------|
| **opencode** | El asistente de IA que ejecuta opencode y coordina agentes |
| **Harness** | La infraestructura configurable de agentes de este proyecto (`.opencode/`) |
| **Agente** | Una "personalidad" especializada con su propio rol, permisos y modelos |
| **Subagente** | Un agente que un primario invoca para tareas específicas |
| **Spec** | Documento que define qué construir (contratos, acceptance criteria) — antes del código |
| **SDD** | Specification-Driven Development: el flujo de trabajo de este proyecto |
| **MCP** | Protocolo para conectar herramientas externas (codegraph, engram…) a los agentes |
| **Permiso** | Regla que decide si una acción corre automática, pide confirmación o se bloquea |
| **Skill** | Conocimiento empaquetado que un agente carga cuando hace una tarea específica |

---
*Este índice crece con el uso. Si un concepto no está documentado, agregá un capítulo.*