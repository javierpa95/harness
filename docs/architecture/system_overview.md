# System Overview

**Proyecto:** [PROJECT_NAME]
**Version:** 0.1.0
**Ultima actualizacion:** [DATE]

---

## Descripcion General

[Una linea que describe que hace el proyecto]

## Stack

| Capa | Tecnologia | Por que |
|------|-----------|---------|
| Frontend | [tecnologia] | [razon] |
| Backend | [tecnologia] | [razon] |
| Database | [tecnologia] | [razon] |
| Deploy | [tecnologia] | [razon] |
| Auth | [tecnologia] | [razon] |

## Arquitectura

```
[Diagrama de arquitectura en ASCII o Mermaid]
```

## Data Flow

```
[Como viajan los datos por el sistema]
```

## Endpoints Principales

| Method | Path | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /api/health | no | Health check |
| [method] | [path] | [yes/no] | [descripcion] |

## Dependencias Externas

| Servicio | Uso | Config |
|----------|-----|--------|
| [servicio] | [uso] | [variable de entorno] |

### MCP Servers

| MCP | Tipo | Cuánto usar |
|-----|------|-------------|
| **CodeGraph** | Local (`npx -y @astudioplus/codegraph-mcp`) | Explorar codebase, impacto de cambios, understanding arquitectura |
| **Context7** | Remote (HTTPS) | Investigar APIs/librerias, ejemplos actualizados |
| **Engram** | Local (binario nativo `engram mcp`) | Memoria persistente entre sesiones, recordar decisiones |

**Configuración:** `.opencode/opencode.jsonc` (sección `mcp`) y `.claude/settings.json`.

**Por defecto habilitados (out-of-the-box):** los 3 MCPs vienen activos al clonar el harness. Cada MCP anade tokens al contexto del LLM; desactiva el que no necesites en `opencode.jsonc`.

---

## Decisiones Arquitectônicas

## Decisiones Arquitectonicas

Ver `docs/architecture/` para ADRs (Architecture Decision Records).

## Seguridad

- Auth via [metodo]
- Datos sensibles en [ubicacion]
- Rate limiting en [endpoints]
- CORS configurado para [origenes]

---

_Actualiza este documento cuando cambie la arquitectura._
