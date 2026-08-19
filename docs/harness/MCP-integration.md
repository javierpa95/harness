# MCP Integration — Guia Completa

**Version:** 0.1.0
**Ultima actualizacion:** [DATE]

---

## Que es MCP

MCP (Model Context Protocol) es un protocollo estandarizado que permite a los agentes de IA conectar a herramientas externas (servers) para ampliar sus capacidades. OpenCode y Claude Code ambos soportan MCP.

### Por que tener MCPs integrados

| MCP | Que hace | Por que importa |
|-----|----------|----------------|
| **CodeGraph** | Graph del codebase (simbolos, call paths, blast radius) | Reemplaza grep + read loops con una sola llamada |
| **Context7** | Busca docs de cualquier libreria | Nunca mas adivinar APIs — siempre referencia actual |
| **Engram** | Memoria persistente entre sesiones | El proyecto recuerda lo que hizo en sesiones anteriores |

> **Advertencia:** Cada MCP server anade tokens al contexto del LLM. Solo activa los que necesites. Un exceso de MCPs puede saturar el contexto.

---

## Como configurar

### 1. Activar/Desactivar MCPs

Los tres MCPs vienen deshabilitados por defecto en el harness. Para activar uno:

```jsonc
// En .opencode/opencode.jsonc
{
  "mcp": {
    "codegraph": {
      "type": "local",
      "command": ["npx", "-y", "@gentlest-mcp/codegraph"],
      "enabled": true  // ← cambiade a true
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      },
      "enabled": true  // ← cambiade a true
    },
    "engram": {
      "type": "local",
      "command": ["npx", "-y", "@gentlest-mcp/engram"],
      "enabled": true  // ← cambiade a true
    }
  }
}
```

### 2. Activar herramientas specificas por-agente

Si tienes muchos MCPs y solo quieres usarlos con un agente specific:

```jsonc
{
  "mcp": {
    "codegraph": { "enabled": true }
  },
  // Deshabilita codegraph globalemente...
  "tools": {
    "codegraph_*": false
  },
  // ...pero activalo solo para el architect
  "agent": {
    "project-architect": {
      "tools": {
        "codegraph_*": true
      }
    }
  }
}
```

### 3. Activar MCPs manualmente sin editar config

OpenCode muestra los MCPs disponibles cuando los tienes configurados. Puedes activarlos/desactivarlos desde el menu interactivo del cliente OpenCode.

---

## MCP por MCP

### CodeGraph

**Tipo:** Local (`npx`)
**Servicio:** Upstash / Gentle AI
**Repo:** `@gentlest-mcp/codegraph`

#### Que hace

CodeGraph es un graph SQLite del codebase que indexa simbolos, edges y archivos. Permite hacer llamadas que reemplazan un `grep + Read` loop:

```
codegraph_explore(query="login flow architecture")
```

**Resultado:** Recibes el source verbatim de los simbolos relevantes PLUS las call paths entre ellos — en UNA sola llamadas, no en 5.

#### Como usarlo

1. **Habilitar en config:** `"enabled": true` en `.opencode/opencode.jsonc`
2. **Indexar el repo:** CodeGraph requiere que el repo este indexado. Se hace automaticamente la primera vez que usas el MCP.
3. **Usar desde el agente:** Poner `use codegraph` en el prompt o dejar que el architect lo use automaticamente.

#### Cuando usarlo

- Explored codebase: `codegraph_explore(query="authentication flow")`
- Impact analysis: `codegraph_explore(query="who calls updateUserEmail")`
- Architecture questions: `codegraph_explore(query="how does login work from UI to DB")`

> CodeGraph es especialmente util cuando necesitas entender como X funciona en un codebase existente.

---

### Context7

**Tipo:** Remote (HTTPS)
**Servicio:** Upstash / Context7
**URL:** `mcp.context7.com/mcp`

#### Que hace

Busca docs actualizadas de cualquier libreria, framework, SDK o herramienta. Soporta React, Next.js, Express, Tailwind, Django, Spring Boot, etc.

#### Como usarlo

1. **Habilitar en config:** `"enabled": true` en `.opencode/opencode.jsonc`
2. **API key (opcional pero recomendado):** Crear cuenta gratuita en [context7.com](https://context7.com) para obtenir higher rate-limits. La config espera `{env:CONTEXT7_API_KEY}`.
3. **Usar desde el agente:** Poner `use context7` en el prompt.

#### Ejemplos de uso

```
Context7: "How to set up middleware in Next.js App Router?"
Context7: "React useEffect cleanup function examples"
Context7: "Express.js JWT authentication best practices 2026"
```

#### Cuándo usarlo

- Necesitas saber la API de una libreria que no memorizas (es normal).
- Quieres ejemplos actualizados (tu training data puede estar obsoleto).
- Estas aprendiendo una nueva libreria/framework.

> **Ventaja:** Context7 siempre lee la documentacion mas reciente — no depende de tu training data.

---

### Engram

**Tipo:** Local (`npx`)
**Servicio:** Gentle AI
**Repo:** `@gentlest-mcp/engram`

#### Que hace

Engram es un sistema de memoria persistente basado en vector search. Permite a los agentes de IA recordar lo que hicieron en sesiones anteriores:

- Decisiones tomadas
- Bugs resueltos
- Patrones establecidos
- Preferencias del usuario
- Aprendizajes de sessions

#### Como usarlo

1. **Habilitar en config:** `"enabled": true` en `.opencode/opencode.jsonc`
2. **Setup inicial:** La primera vez que se usa, Engram crea una base de datos local en `~/.opencode/engram.db` (o similar).
3. **Usar desde el agente:** Los agentes usan las herramientas `mem_save`, `mem_search`, `mem_session_summary` etc.

#### Cuándo usarlo

- Sesiones largas multi-day: recordar lo que se hizo antes de la compaction.
- Colaboracion entre agentes: cada agente puede leer/escribir memoria compartida.
- Aprendizaje continuo: guardar patrones y mejores practicas que surjan.

---

## MCP en Claude Code

Para Claude Code, la config de MCP va en `mcpServers` dentro de `.claude/settings.json` o un `.claude/mcp.json`. ElHarness mantiene un mirror automatico.

### Estructura mirror

```
.claude/
└── settings.json  ← MCP config va aqui
```

#### Como habilitar MCPs en Claude Code

```jsonc
{
  // En .claude/settings.json
  "mcpServers": {
    "codegraph": {
      "command": "npx",
      "args": ["-y", "@gentlest-mcp/codegraph"]
    },
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "tu-api-key-aqui"  // o dejar vacio para uso basico
      }
    },
    "engram": {
      "command": "npx",
      "args": ["-y", "@gentlest-mcp/engram"]
    }
  }
}
```

> **Nota:** Claude Code no soporta el `{env:VAR}` syntax. Necesitas poner el valor real del env var en la config de Claude Code.

---

## Como crear un MCP nuevo

### Template para nuevo MCP

```jsonc
// En .opencode/opencode.jsonc
{
  "mcp": {
    "my-new-mcp": {
      "type": "local",  // o "remote"
      "command": ["npx", "-y", "npm-package-name"],
      // Para remote:
      // "url": "https://mcp.example.com/mcp",
      "headers": {
        "MY_API_KEY": "{env:MY_API_KEY}"
      },
      "enabled": false  // Deshabilitado por defecto
    }
  },
  "tools": {
    "my-new-mcp_*": false  // Deshabilitado por defecto
  }
}
```

### Pasos

1. Añadir a `opencode.jsonc` con `enabled: false`
2. Añadir mirror a `.claude/settings.json`
3. Escribir documentación en `docs/harness/MCP-integration.md`
4. Actualizar `HARNESS_SUMMARY.md`

---

## Best Practices

### Cuando usar cada MCP

| Situacion | MCP recomendado |
|-----------|----------------|
- Explorar codebase desconocido | CodeGraph
- Investigar API de libreria | Context7
- Recordar sesiones anteriores | Engram
- Revisar codigo de otro repo | CodeGraph + Git MCP
- Aprender algo nuevo | Context7

### Regla de oro

> **Menos MCPs = menos tokens.** No actives todos los MCPs si no los usas. Activa solo los que necesites para el cambio en que trabajas.

### Costes de contextu

| MCP | Tokens aproximados por llamada |
|-----|-------------------------------|
| CodeGraph | 500-5000 (depende del codebase) |
| Context7 | 200-3000 (depende de la doc) |
| Engram | 100-1000 (depende de la memoria) |

---

## Recursos

- [OpenCode MCP docs](https://opencode.ai/docs/mcp-servers/)
- [Context7 docs](https://context7.com)
- [CodeGraph docs](https://github.com/gentle-ai/codegraph)
- [MCP Protocol spec](https://github.com/modelcontextprotocol/specification)

---

_Esta guia se actualiza con nuevos MCPs y patrones. Mantela al dia con los cambios del harness._