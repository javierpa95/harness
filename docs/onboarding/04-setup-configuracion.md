# 04 · Setup y configuración del harness

> **Qué sabés después de leer esto:** cómo configurar el harness en un solo paso sin tocar archivo por archivo, cómo funciona `make setup`, y la filosofía del "single source of truth".

El harness busca **no hacerte editar 8 archivos a mano** para configurarlo. En cambio, hay **un punto central** (`harness.settings.jsonc`) y un comando que lo aplica a todo: **`make setup`**.

---

## El comando: `make setup`

Ejecutalo desde la raíz del proyecto:

```bash
make setup
```

Qué hace:
- **`make setup`** → abre la **mini-TUI** de pantalla completa (sin librerías externas). Ves la lista de agentes con su **modelo** y **modo** (`primary`/`subagent`/`all`) a la derecha. Navegás con **flechas ↑/↓**, presionás **Enter** en una fila para elegir el modelo, **M** para ciclar el modo, y **Q/ESC** para terminar. Al salir guarda `harness.settings.jsonc` y aplica. Carga los valores ya guardados para que los vuelvas a editar cómodo.
- **`make setup-file`** → modo *file-driven*: aplica lo que dice `harness.settings.jsonc` a los agentes, sin interacción.

> El valor por defecto (`make setup`) es siempre la TUI, para que no tengas que acordarte del formato del archivo. `setup-file` es útil para CI o para re-aplicar una config ya escrita.

> En la TUI **no tenés que escribir `provider/model-id` de memoria**: el script corre `opencode models`, agrupa por provider (p.ej. `nan`, `ollama`, `opencode-go`) y te deja navegar los modelos. Si dejás un rol sin elegir, queda **sin `model:`** y hereda el modelo del agente primario.

## El archivo: `harness.settings.jsonc`

Es la **Single Source of Truth** (única fuente de verdad) de la config de agentes. Vive en `.opencode/`:

```
.opencode/
  harness.settings.jsonc          ← TOCÁ SOLO ESTO
  harness.settings.jsonc.example  ← referencia commitada (cómo se ve)
  agents/*.md                     ← lo actualiza make setup (no lo toques a mano)
```

Formato:

```jsonc
{
  "default_model": "provider/model-id",
  "agents": {
    "spec-writer": { "model": "provider/model-id" },
    "backend-developer": { "model": "provider/model-id" }
  }
}
```

> **El campo `model` siempre lleva prefijo de provider**: `"anthropic/claude-..."`, `"openai/gpt-..."`. Usá `opencode models` para listar los que tenés configurados.

> ⚠️ El archivo real (`harness.settings.jsonc`) está **gitignored** — es local (cada dev puede tener sus modelos). Solo se commitea el `.example` como referencia.

## Por qué arquitectura "dos modos en uno"

- **File-driven** = reproducible y declarativo. Perfecto para CI o para que cualquier dev clone y tenga la misma config.
- **Interactivo** = amigable para quien llega nuevo y no quiere aprender el formato.

`make setup` soporta ambos: el archivo si existe, y si no, pregunta. Lo mejor de cada mundo.

## Cómo evoluciona el setup

> 🔧 **En evolución:** hoy `make setup` configura los **modelos de los subagentes**. La intención es que crezca para también configurar permisos, MCP y skills desde el mismo centro. A medida que se agregue, este capítulo crece — y eventualmente esto se convierte en una skill para que los agentes lo ejecuten.

## Fallo común: modelos válidos

Si ponés un `model` que no existe en tu provider, opencode puede fallar. Antes de aplicar, verificá con:

```bash
opencode models
```

Y si opencode no arranca por un config roto, el escape hatch es:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode   # arranca sin el config del proyecto
```

---

**Siguiente:** [Capítulo 05 — Crear y editar agentes](05-crear-editar-agentes.md) *(planificado)*

---
*¿Configuraste algo más del harness a mano y querés que entre al `make setup`? Es el próximo capítulo de desarrollo.*