# Reglas de Desarrollo

## Velocidad > Perfeccion

Las reglas existen para evitar catastrofes, no para ralentizar. Ajusta la rigidez al tamano del equipo.

## Planificacion

- **Cambios pequenos (<3 archivos)**: Implementa directo, sin plan.
- **Cambios medianos (3-10 archivos)**: Plan breve (2-3 bullets).
- **Cambios grandes (>10 archivos o arquitectura)**: Plan detallado con fases.

## Commits

- Usa conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `security:`
- Mensajes claros y descriptivos
- Commits atomicos: un cambio = un commit
- Build antes de push

## Verificacion minima

Antes de declarar tarea completa:
1. Build pasa — debe pasar
2. No hay `.env` o datos locales en staging

## Dependencias

- NO instalar dependencias globales (-g)
- Usar el package manager del proyecto
