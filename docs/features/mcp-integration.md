# Feature: MCP Server Integration + Educational Docs

## Status

`draft`

## Overview

Integrar tres MCP servers (CodeGraph, Context7, Engram) como parte nativa del harness y crear un directorio `docs/harness/` para documentar TODO lo que hace este repo como material educativo — no solo docs del proyecto que use el harness, sino **docs del propio harness** para enseñar a otros desarrolladores a usar MCP, SDD, agentes y las herramientas avanzadas.

## Motivation

El harness actualmente tiene **cero configuración MCP**. Los tres servidores que el usuario usa (CodeGraph, Context7, Engram) están activos porque OpenCode ya los tiene configurados **fuera del repo** — en el cliente OpenCode local. Pero para un template/portable, esto es un problema: cualquier persona que clone el repo no sabra que puede usar estos MCP ni como configurarlos.

Ademas, el harness carece de un espacio dedicado donde se documente **como se usa el harness** como material educativo: como funcionan los agentes, como configurar MCP, como usar el flujo SDD con herramientas avanzadas, etc.

## User Stories

1. As a **new user** of the harness, I want MCP servers pre-configured in the template so I can activate them and start using powerful tools immediately.
2. As a **developer** using the harness, I want a `docs/harness/` directory with educational material so I can understand SDD, MCP tools, agent patterns, and advanced OpenCode/Claude Code tips.
3. As a **learner** interested in AI-assisted development, I want the harness to serve as a reference guide for building and configuring AI agent systems.

## Acceptance Criteria

- [ ] `.opencode/opencode.jsonc` tiene seccion `mcp` con 3 servidores (codegraph, context7, engram)
- [ ] `.opencode/opencode.jsonc` tiene `tools` deshabilitando los MCP globales por defecto
- [ ] `.claude/settings.json` tiene mirror de MCP config (si aplica para CC)
- [ ] `docs/harness/MCP-integration.md` existe y documenta los 3 servers + OpenCode + Claude Code + como extender
- [ ] `docs/harness/agents-patterns.md` existe y documenta patron de agentes (como crear, tooling, mejores practicas)
- [ ] `docs/harness/sdd-advanced.md` existe y documenta flujo SDD avanzado (SDD + MCP + CodeGraph + Context7)
- [ ] `docs/development/HARNESS_SUMMARY.md` actualizado con seccion de MCP y docs
- [ ] `docs/architecture/system_overview.md` actualizado con nueva seccion de MCP
- [ ] `docs/CHANGELOG.md` tiene entrada para esta feature

## Data Contract

No hay API endpoints ni entidades de datos. Es configuracion y docs.

## Edge Cases

- **MCPs anaden tokens al contexto**: Cada MCP server anade context al LLM. Se debe advertir que no se necesitan todos a la vez. Solo activar los utiles por proyecto.
- **Context7 API key**: El usuario necesita crear una cuenta gratuita en `context7.com` para get higher rate-limits. La config espera `{env:CONTEXT7_API_KEY}`. Se debe documentar como NO obligatoria para uso basico, pero recomendada.
- **CodeGraph requiere index**: Si el usuario clona un repositorio nuevo, CodeGraph necesita correr `index` primero. Se documenta en `MCP-integration.md`.
- **Engram requiere setup**: Engram persiste en base de datos local. Se documenta en `MCP-integration.md`.

## Security / Privacy

- [ ] Los MCP servers son third-party services (CodeGraph/Upstash, Vercel, Upstash)
- [ ] Context7 API key se maneja via `{env:` — NUNCA hardcodear
- [ ] CodeGraph index se guarda en `.codegraph/` — no debe ser comiteado (ya lo hace `.gitignore`)
- [ ] Engram persiste en base de datos local — no envia datos a terceros

## Dependencies

- Dependencia de MCP servers externos: CodeGraph (gentle-ai), Context7 (upstash), Engram (gentle-ai)

## Documentation Updates

Cuando esta feature se implemente, actualizar:
- [ ] `docs/harness/MCP-integration.md` (nuevo)
- [ ] `docs/harness/agents-patterns.md` (nuevo)
- [ ] `docs/harness/sdd-advanced.md` (nuevo)
- [ ] `docs/development/HARNESS_SUMMARY.md` (nueva seccion de MCP + docs)
- [ ] `docs/architecture/system_overview.md` (nueva seccion de MCP)
- [ ] `docs/CHANGELOG.md` (nueva entrada)

## Notes

### Decisiones tomadas

1. **MCPs deshabilitados por defecto**: Se deshabilitan por defecto (`enabled: false`) porque anaden tokens al contexto del LLM y no todos proyectos los necesitan. El usuario los activa manualmente.
2. **Configuracion en `.opencode/opencode.jsonc`**: Es el unico archivo de config de OpenCode. Se anade la seccion `mcp` alli.
3. **Mirror en `.claude/settings.json`**: Para Claude Code, la config de MCP va en `mcpServers` dentro de `settings.json`. Se mantiene el mirror para que el template funcione en ambas plataformas.
4. **`docs/harness/` como directorio educativo**: No es `docs/features/` porque esto NO es una feature de un proyecto que use el harness — es documentacion del propio harness como material educativo.
5. **Tres MCPs iniciales**: CodeGraph (graph del codebase), Context7 (docs de librerias), Engram (memoria persistente). Son los que el usuario ya usa y son los mas utiles para desarrollo asistido por IA.

### Estructura propuesta de `docs/harness/`

```
docs/harness/
├── MCP-integration.md     — Guia completa de MCP (como configurar, usar, extender)
├── agents-patterns.md     — Guia de agentes (como crearlos, tooling, mejores practicas)
└── sdd-advanced.md        — Guia avanzada (SDD + MCP + CodeGraph + Context7)
```

---

_Esta spec es el contrato entre architect y developers. Sigue los AC e implementa._