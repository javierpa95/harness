---
description: Persiste los aprendizajes de la sesion en docs/development/session-log.md y cierra con resumen.
---

# /end — Ritual de Cierre de Sesion

## Descripcion

Persiste los aprendizajes, decisiones y problemas de la sesion actual en `docs/development/session-log.md`.

## Pasos de Ejecucion

### 1. Consultar al usuario

Pregunta obligatoriamente (question tool):

```
📝 Session End — Ayudame a guardar la memoria de esta sesion.

Responde brevemente (puedes usar bullets):

1. ¿Que hicimos hoy? (max 3 lineas)
2. ¿Que decisiones tecnicas tomamos? (si aplica)
3. ¿Que problemas encontramos y como los resolvimos? (si aplica)
4. ¿Que aprendizaje clave deberia recordar el proximo agente? (1-2 lineas)
```

### 2. Leer el formato actual

Leer `docs/development/session-log.md` para ver el template y la ultima entrada.

### 3. Append al session-log

Anadir la nueva entrada al FINAL de `docs/development/session-log.md` usando la herramienta de edicion apropiada para tu plataforma (Edit/Write en OpenCode; en su defecto, el metodo de append nativo del shell actual — no asumas sintaxis bash si estas en PowerShell).

Estructura de la entrada:

```markdown
## YYYY-MM-DD - <Titulo breve de la sesion>

### Contexto
<Respuesta del usuario al punto 1>

### Decisiones tomadas
<Respuesta al punto 2, o "Ninguna significativa">

### Problemas encontrados
<Respuesta al punto 3, o "Ninguno">

### Aprendizajes
<Respuesta al punto 4>
```

**Reglas para el append**:

- Usar la fecha actual (YYYY-MM-DD).
- Titulo: max 6 palabras, descriptivo.
- No borrar contenido previo. Solo append.

## Formato de Respuesta Obligatorio

```
✅ Session End Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Entrada anadida a: docs/development/session-log.md
   Fecha: YYYY-MM-DD
   Titulo: <titulo>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El proximo agente que ejecute /start leera esta entrada.
```

## Notas

- Este command puede **editar** `docs/development/session-log.md`.
- Nunca toca codigo fuente (`apps/`, `services/`).
