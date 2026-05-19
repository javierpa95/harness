# Estructura del Proyecto

## Layout (sugerido — adaptar al stack)

```
apps/           ← Aplicaciones que se ejecutan
  web/          🌐 Frontend (ajustar nombre segun stack)

services/       ← Servicios / Backend
  backend/      💾 API + Base de datos (ajustar nombre segun stack)

docs/           ← Documentacion
  architecture/ Decisiones tecnicas
  features/     Specs de funcionalidades
  legal/        Privacidad, terminos
  development/  Memoria, session log

config/         ← Configuracion
  .env.example  Variables de entorno
```

### Patrones alternativos

```
# Monorepo multiples apps
apps/
  web/
  admin/
  api/
packages/
  shared/
  ui/

# App simple (sin monorepo)
src/
  components/
  pages/
  services/
  utils/
```

## Reglas de Ubicacion

| Si quieres poner... | Va en... |
|---------------------|----------|
| UI / Paginas / Componentes | `apps/web/` o `src/` |
| Backend / API / DB | `services/backend/` |
| Librerias compartidas | `packages/shared/` o `src/utils/` |
| Documentacion tecnica | `docs/architecture/` |
| Specs de features | `docs/features/` |
| Configuracion global | `config/` |

## Convenciones de Nombres

- **NO espacios** en nombres de carpetas o archivos
- **PascalCase** para componentes (`ProductCard.tsx`)
- **kebab-case** para paginas/rutas (`product-detail`)
- **camelCase** para utils/services (`productService.ts`)
- **Nombres de tablas/collections en plural e ingles** (`products`, `users`)

## Regla de Oro de Consistencia

> **Si cambias una API, schema o interface, actualiza TODOS los consumidores.**
