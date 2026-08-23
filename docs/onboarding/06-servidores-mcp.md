# 06 · MCP servers

> **Qué sabés después de leer esto:** qué son los servidores MCP, cuáles trae este template, cómo agregar uno nuevo o desactivar los heredados, y los gotchas del merge de configs.

---

## Qué es MCP (en 30 segundos)

MCP (**Model Context Protocol**) es la forma estándar de conectar herramientas externas a los agentes. En vez de integrar cada herramienta a mano, el agente "habla" con ella vía un servidor MCP que expone sus herramientas y recursos.

## Los servidores del template

Declarados en `.opencode/opencode.json`:

```json
"mcp": {
  "codegraph": { "type": "local",  "command": ["codegraph", "serve", "--mcp"], "enabled": true },
  "context7":  { "type": "remote", "url": "https://mcp.context7.com/mcp",        "enabled": true },
  "engram":    { "type": "local",  "command": ["engram", "mcp", "--tools=agent"], "enabled": true }
}
```

| Servidor | Tipo | Para qué | Dependencia |
|----------|------|----------|-------------|
| **codegraph** | local | Buscar/entender el código (símbolos, flujos) | binario `codegraph` en PATH |
| **context7** | remote | Docs actualizadas de librerías | ninguna |
| **engram** | local | Memoria persistente entre sesiones | binario `engram` en PATH |

## Cómo agregar un MCP nuevo

Agregalo al objeto `mcp` en `.opencode/opencode.json`:

```json
"mcp": {
  "playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp"],
    "enabled": true
  }
}
```

- `type: "local"` → requiere `command` (array de strings del binario + args).
- `type: "remote"` → requiere `url` (y opcionalmente `headers`).

Reglas:
- **`command` SIEMPRE es un array**, nunca un string suelto.
- **Preferí nombre portable** (`"engram"`) sobre rutas absolutas hardcodeadas, para que el template se copy en otras máquinas.
- Los valores de headers soportan interpolación: `{env:MIVAR}` o `{file:path}`.

## Cómo desactivar un MCP heredado

Si un servidor viene de un config de nivel superior (global/organización) y no lo querés en este proyecto:

```json
"mcp": {
  "supabase": { "enabled": false }
}
```

Funciona porque opencode **fusiona** las configs por nombre: proyecto → global, y desactivás con `enabled: false`.

## Merge de configs (la clave)

opencode **no reemplaza** configs — las **fusiona** por profundidad. Orden de precedencia (sobrescribe el anterior):

```
remote (organización) → global → proyecto → .opencode/
```

Esto significa:
- Los MCP de **tu config global** siguen disponibles en el proyecto (se suman).
- Los MCP **del proyecto** van en el template y el que copie los hereda sin tocar su global.
- Misma clave en ambos → el de proyecto (más específico) gana.

> ⚠️ Por eso `supabase` (que lleva tu `project_ref`) vive en tu **global** y no en el template: es específico de tu proyecto remoto, no algo que cualquiera deba copiar.

## Troubleshooting

| Problema | Qué hacer |
|----------|-----------|
| Un MCP local no funciona | Verificá que el binario esté instalado y en PATH (`codegraph`, `engram`) |
| Cambié config y no veo el MCP | **Reiniciá opencode** — no hay hot-reload |
| No sé qué models/providers tengo | `opencode models` |

**Siguiente:** [Capítulo 07 — Mantenimiento del harness](07-mantenimiento-harness.md)

---
*¿Usás un MCP que valga la pena compartir? Agregalo a esta tabla.*