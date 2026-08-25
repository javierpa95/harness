# BACKLOG — [PROJECT_NAME]

Pendientes, ideas y deudas técnicas **del proyecto**. Es el mapa de hacia dónde vamos:
cualquier cosa que no se trabaja AHORA vive aquí, no en la cabeza de nadie.

> Convenciones (mismas que el backlog del harness):
> Prioridad: 🔥 alto | 🧊 medio | ❄️ algún día
> Un item se promueve a spec (`docs/features/`) cuando toca trabajarlo.
> Los items completados se mueven a "Hecho" con fecha — el detalle fino queda en el git log.

---

## Pendiente

- [ ] 🔥 (ejemplo) Definir y crear la primera feature: sustituir por tu idea real
- [ ] 🧊 (ejemplo) Elegir stack definitivo si aún no está cerrado

## En progreso

- (vacío — lo activo vive en specs con status `in-progress`)

## Hecho

- (vacío — muévelo aquí desde Pendiente con fecha, ej: `✅ 2026-08-25 setup inicial`)

---

## Cómo se usa

| Momento | Qué hace el agente |
|---------|--------------------|
| Surge una idea que no es para ahora | Se registra en `Pendiente` con prioridad |
| `/start` al abrir sesión | Revisar el top del backlog antes de planear |
| El architect decide trabajar un item | Promueve a spec en `docs/features/` y lo marca "En progreso" |
| La feature pasa review + docs | Se mueve a `Hecho` con fecha; CHANGELOG recoge lo user-facing |
