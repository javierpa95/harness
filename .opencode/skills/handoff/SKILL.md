---
name: handoff
description: Compacta la conversacion actual en un documento de handoff para que otro agente continue el trabajo. Redacta secrets, referencia artifacts por path.
invocation: user
---

# Handoff — Documento de Transferencia

Compacta la conversacion actual en un documento de handoff para que un agente fresco pueda continuar el trabajo sin perder contexto.

## Cuando usar

- Cuando necesitas que otro agente retome una tarea a medias
- Al final de una sesion larga para preservar el contexto
- Cuando cambias de agente principal (ej: de architect a developer)

## Que incluir

### 1. Contexto del Proyecto
- Nombre y descripcion del proyecto
- Stack tecnologico actual
- Estado general (que se esta construyendo, que falta)

### 2. Trabajo Reciente
- Que se hizo en esta sesion (resumen ejecutivo)
- Que esta pendiente o a medias
- Decisiones tomadas y por que

### 3. Architectura y Estructura
- Archivos clave modificados recientemente
- Dependencias importantes
- Configuraciones relevantes

### 4. Especificaciones Activas
- Specs en `docs/features/` con su status
- Cualquier decision arquitectonica pendiente

### 5. Sugerencias para el Siguiente Agente
- Que skills deberia invocar
- Que archivos deberia leer primero
- Que tener cuidado (areas fragiles, bugs conocidos)

## Formato del Documento

```markdown
# Handoff — [Fecha]

## Proyecto
- Nombre: [nombre]
- Stack: [tecnologias]
- Estado: [resumen]

## Trabajo de esta Sesion
1. [Que se hizo]
2. [Que quedo pendiente]
3. [Decisiones tomadas]

## Archivos Clave
- `path/to/file` — [que hace, que se cambio]

## Specs Activas
- `docs/features/feature-a.md` — status: [draft/approved/in-progress/done]

## Para el Siguiente Agente
- Lee primero: `AGENTS.md`, `CONTEXT.md`
- Skills sugeridas: [lista]
- Cuidado con: [areas fragiles]
```

## Reglas

1. **Redacta secrets** — Nunca incluyas API keys, passwords, tokens
2. **Referencia por path** — No dupliques contenido de specs, ADRs o commits. Referencia por ruta
3. **Sé conciso** — El documento es para transferir contexto, no para contar toda la historia
4. **Guarda en directorio temporal** — Usa el directorio temporal del OS, no el workspace
