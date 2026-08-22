# 01 · Conceptos básicos

> **Qué sabés después de leer esto:** qué es opencode, qué es el harness, qué es un agente, y las piezas que componen este proyecto — sin necesidad de saber usado antes.

Este capítulo es **nivel cero**. Si ya venís de otros asistentes de código (Claude Code, Cursor, Copilot), mucho sonará familiar; usalo como base y saltá al [capítulo 3](03-harness-en-practica.md).

---

## 1. ¿Qué es opencode?

**opencode es un asistente de IA que vive en la terminal y ejecuta tareas en tu código.** Escribís una instrucción en lenguaje natural y él puede leer archivos, editarlos, ejecutar comandos, buscar, consultar internet, delegar sub-tareas — y todo eso coordinado por un flujo definido.

Se diferencia de un chatbot simple en que es **agentico**: puede dar varios pasos por su cuenta (leer → entender → editar → testear → commitear) siguiendo una conversación.

> Es open-source, corre en tu máquina y la config vive en el proyecto.

## 2. ¿Qué es un "harness" (arnés)?

El **harness** es la **infraestructura configurable de agentes** que este proyecto trae. Es decir: la capa que define *cómo* la IA trabaja en este repositorio, no *qué* código produce.

Vive en la carpeta `.opencode/`:

```
.opencode/
  agents/       ← Los agentes (cada uno con rol y permisos)
  commands/     ← Comandos rápidos (/start, /end)
  rules/        ← Leyes técnicas por dominio (development, git, security, structure)
  skills/       ← Conocimientos que los agentes cargan bajo demanda
  opencode.json ← Config raíz (permisos globales, MCP, agente por defecto)
```

**La idea clave:** si copiás la carpeta `.opencode/` a otro proyecto nuevo, ese proyecto hereda esta forma de trabajar. Por eso este repositorio lo tratamos como **template**.

## 3. ¿Qué es un agente?

Un **agente** es una "personalidad" especializada dentro de opencode. Tiene:

- un **rol** (qué hace y qué NO hace),
- un conjunto de **permisos** (qué puede leer, editar, ejecutar),
- y opcionalmente un **modelo** propio.

En este proyecto los roles están separados para imponer disciplina:

| Agente | Rol | ¿Puede editar? | ¿Puede correr bash? |
|--------|-----|:---:|:---:|
| `project-architect` | Orquesta el flujo SDD (decide, delega) | ✔ | ✔ |
| `harness-architect` | Mantiene el propio harness (config, skills) | ✔ | ✔ |
| `spec-writer` | Escribe las specs en `docs/features/` | ✔ (solo specs) | ✖ |
| `frontend-developer` | Implementa la UI | ✔ | según config |
| `backend-developer` | Implementa backend, con TDD | ✔ | ✔ |
| `code-reviewer` | Revisa implementación contra la spec | ✖ | ✔ (solo leer/ejecutar tests) |
| `gdpr-auditor` | Auditoría de seguridad/privacidad | ✖ | ✖ |

> Los lectores: revisores y auditores son **read-only**: no pueden editar, que es lo que garantiza que no "arreglan" ellos mismos durante una review.

### Agentes primarios vs subagentes

- **Primario** (`mode: primary`): el que habla directamente con vos en la sesión principal. Cicláis con **Tab**.
- **Subagente** (`mode: subagent`): un especialista que un primario invoca (o invocás con `@nombre`) para una tarea puntual.

## 4. ¿Qué es una "spec"?

Una **spec** (especificación) es un documento que define **qué construir, antes de que se construya.** Dice:

- los objetivos de la funcionalidad,
- los **contratos de datos** (qué campos, tipos),
- las **user stories** / casos de uso,
- los **acceptance criteria** (criterios para considerar que está bien).

Viven en `docs/features/<feature>.md`. La regla de oro: **no se escribe código sin una spec aprobada** (salvo cambios triviales).

## 5. ¿Qué es MCP?

MCP (**Model Context Protocol**, "Protocolo de Contexto del Modelo") es la manera estándar de conectar herramientas externas a un agente. En vez de integrar cada herramienta a mano, el agente la habla vía MCP.

Este template ya trae tres servidores MCP:

| Servidor | Para qué |
|----------|----------|
| **codegraph** | Buscar y entender el código (símbolos, flujos) sin leer archivo por archivo |
| **context7** | Obtener documentación actualizada de librerías/frameworks |
| **engram** | Memoria persistente del agente entre sesiones |

> Están declarados en el proyecto (`.opencode/opencode.json`), así que cualquiera que copie el template los tiene sin tocar su config global.

## 6. ¿Qué es un permiso?

Un **permiso** es una regla que decide qué pasa cuando un agente quiere hacer una acción bajo el contexto del proyecto. Hay 3 resultados:

| Valor | Significado |
|-------|-------------|
| `allow` | Corre automático, sin preguntar |
| `ask`  | (pregunta) te pide confirmación |
| `deny` | Bloqueado, no se ejecuta |

Se configuran a nivel global/proyecto y se pueden sobreescribir por agente (más granularidad) — lo detenido en el capítulo 4.

---

## Resumen en una línea

El **harness** es como el **andamiaje** que le da forma al trabajo de la IA en este proyecto: define quién hace qué, con qué permisos, bajo qué flujo (SDD) — y todo esto se versiona con el código para que cualquier dev nuevo pallevea y lo use igual.

**Siguiente:** [Capítulo 2 — El flujo SDD](02-flujo-sdd.md)

---
*¿Algo de este capítulo te quedó confuso? Escribí tu duda en el índice y agregamos el capítulo que lo resuelva.*