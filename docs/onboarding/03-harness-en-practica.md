# 03 · El harness en la práctica

> **Qué sabés después de leer esto:** cómo usar el harness día a día: cómo arrancar, qué comandos existen, dónde vive cada cosa, y qué hacer cuando algo no te deja editarlo o no se comporta como esperás.

## Arrancar una sesión

1. Abrí la terminal en la raíz del proyecto.
2. Ejecutá `opencode`.
3. Al arrancar, abrí el agente primario que querés (Tab para ciclar) — por defecto `project-architect`.
4. Ejecutá el comando **`/start`** para cargar el contexto del proyecto (AGENTS.md, agenda de sesión, memoria).

> Alternativa: `/start` es opcional pero recomendado en la primera sesión o después de mucho tiempo.

## Agentes primarios

| Agente | Para qué lo usás |
|--------|------------------|
| `project-architect` | El orquestador SDD. Pedíle features o cambios y él delega. |
| `harness-architect` | Cualquier cambio al propio `.opencode/` (config, skills, agentes, permisos). |
| `build` (built-in) | Trabajo libre sin el flujo SDD impuesto — útil para tareas puntuales/triviales. |

## Comandos del harness

| Comando | Qué hace |
|---------|----------|
| `/start` | Carga el contexto completo al inicio (recomendado). |
| `/end` | Persiste aprendizajes de la sesión en `docs/development/session-log.md`. |

> Para ver todos los comandos de opencode, abrí la paleta con **Ctrl+P** en la TUI.

## Dónde vive cada cosa

| Cosa | Dónde |
|------|-------|
| Agentes | `.opencode/agents/*.md` |
| Config raíz | `.opencode/opencode.json` |
| Reglas técnicas | `.opencode/rules/*.md` |
| Skills | `.opencode/skills/*/SKILL.md` |
| Comandos | `.opencode/commands/*.md` |
| Specs de features | `docs/features/*.md` |
| Arquitectura | `docs/architecture/system_overview.md` |
| Manual (este libro) | `docs/onboarding/README.md` |

## Trabajando con el flujo

1. Pedí cambios al `project-architect` describiendo **qué querés**, no **cómo**.
2. Él delega a `spec-writer` → developers → reviewers.
3. Al final, él propone un commit. Vos lo aprobás.

**Consejo para pedidos claros:** "Quiero poder [acción] para [usuario/persona], con [requisito]." Evitá "hacé esto así" a menos que tengas una razón técnica (eso es trabajo de implementación, no del pedido).

## Troubleshooting rápido

| Problema | Qué hacer |
|----------|-----------|
| Edito config y opencode no arranca | Validá el JSON primero. Escapes: `OPENCODE_DISABLE_PROJECT_CONFIG=1` arranca sin el config del proyecto para que puedas arreglarlo. |
| Cambié config y no veo efecto | El config se carga al arrancar — **reiniciá opencode**. No hay hot-reload. |
| Un agente no me edita algo (`deny`) | Revisá permisos: los del proyecto (`.opencode/opencode.json`) y los del agente (frontmatter). El agente puede sobreescribir el global. |
| No me funciona un MCP | Verificá que el binario esté instalado y en PATH (codegraph, engram). Doc en `docs/onboarding/06-servidores-mcp.md` (planificado). |
| El harness-architect no puede tocar config | Definí la regla en su frontmatter, no solo `edit: allow`. Ver capítulo 4. |

## Regla de oro

> **El harness es infraestructura compartida.** Cambios a `.opencode/` afectan a todos los flujos. Antes de tocar una regla o permiso, pensá: *¿qué comportamiento estoy cambiando?* Si no podés responder, no lo toques todavía — preguntá.

**Siguiente:** [Capítulo 4 — Configuración y permisos](04-configuracion-permisos.md) *(en desarrollo)*

---
*¿Un comando o atajo que repetís mucho? Podés agregar un capítulo acá para que quede documentado.*