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

## Decisiones Arquitectonicas

Ver `docs/architecture/` para ADRs (Architecture Decision Records).

## Seguridad

- Auth via [metodo]
- Datos sensibles en [ubicacion]
- Rate limiting en [endpoints]
- CORS configurado para [origenes]

---

_Actualiza este documento cuando cambie la arquitectura._
