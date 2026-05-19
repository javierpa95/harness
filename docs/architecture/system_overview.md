# System Overview — [PROJECT_NAME]

## Architecture

```
┌─────────────────────────────────────────┐
│           [DEPLOYMENT TARGET]            │
│  ┌──────────────┐    ┌───────────────┐  │
│  │   Frontend   │◄──►│   Backend     │  │
│  │   [Port]     │    │   [Port]      │  │
│  │              │    │               │  │
│  └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────┘
```

> **Actualizar este diagrama** con la arquitectura real del proyecto.

## Components

### Frontend: [FRAMEWORK] (apps/web/)

- Describir las principales areas de la UI
- Rutas publicas vs protegidas
- Integraciones externas

### Backend: [TECHNOLOGY] (services/backend/)

- Auth y gestion de usuarios
- Principales entidades/collections
- API endpoints o collections principales

## Data Flow

1. **User** → Describir flujo principal
2. **Admin** → Describir flujo de administracion
3. **System** → Describir procesos automaticos

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | [Framework] | [Purpose] |
| Backend | [Technology] | [Purpose] |
| Database | [DB] | [Purpose] |
| Deployment | [Platform] | [Purpose] |

## Data Model

Ver `AGENTS.md` para el esquema de datos principal.
