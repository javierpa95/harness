# 02 · El flujo SDD

> **Qué sabés después de leer esto:** cómo avanza el trabajo en este proyecto de principio a fin, qué hace cada rol en el ciclo, y por qué el código no se escribe "a lo loco".

**SDD** = **Specification-Driven Development** (Desarrollo Guiado por Especificación). Es la columna vertebral de este harness: **nada se implementa sin una spec, nada se commitea sin review.**

---

## El ciclo de un vistazo

```
1. ANALYZ    → El arquitecto analiza la petición
2. SPEC      → spec-writer escribe/actualiza la spec
3. IMPLEMENT → Los developers implementan (TDD en backend)
4. REVIEW    → code-reviewer verifica contra la spec + tests
5. DECIDE    → El arquitecto: ¿Pasa (commit) o itera?
```

> **El paso 5 NO es automático.** Siempre hay una persona o el arquitecto que decide. El review nunca es solo un trámite.

## Paso por paso

### 1. ANALYZ (arquitecto)
El arquitecto entiende lo que pedís, verifica si ya existe una spec, y decide el alcance. También detecta si hay backend/utils (aplica TDD) o solo UI.

### 2. SPEC (¿spec-writer)
Se escribe o actualiza la spec en `docs/features/`. Define contratos de datos y **acceptance criteria** — que luego se traducen en tests.

### 3. IMPLEMENT (developers)
- `frontend-developer` implementa la UI directo (sin TDD).
- `backend-developer` implementa API/DB con **TDD**: Red → Green → Refactor.

### 4. REVIEW (code-reviewer)
Verifica que lo implementado cumple la spec, que los tests pasan, y busca bugs/seguridad. Si hay datos sensibles, corre en paralelo con `gdpr-auditor`. **También verifica que la documentación esté al día.**

### 5. DECIDE (arquitecto)
- **PASS** → commit + tarea done.
- **FAIL** → vuelve al paso 3 (iterar).

---

## ¿Y el TDD?

| Capa | ¿TDD? | Por qué |
|------|:---:|---------|
| Backend (API, lógica, DB, auth) | ✔ | Lógica pura, fácil de testear, alto valor |
| Utils/Shared (helpers, validators) | ✔ | Funciones puras, tests simples |
| Frontend (UI, componentes, páginas) | ✖ | Complejo de testear, menor ROI |

## Excepciones al flujo

| Caso | Qué pasa |
|------|-----------|
| Cambio trivial (texto, color, formateo) | Se salta spec y review (solo implement) |
| Bug fix simple (no cambia comportamiento) | Se salta spec y review |
| Bug fix que cambia comportamiento | Flujo completo (spec + tests obligatorios) |
| Datos sensibles | Review + auditor de seguridad en paralelo |

---

## Por qué tanta ceremonia

Porque el **git log y las specs son documentación viva**. Un historial limpio y specs claras dejan que cualquier dev nuevo (o humano del futuro) entienda *por qué* se hizo lo que se hizo, sin adivinar.

**Siguiente:** [Capítulo 3 — El harness en la práctica](03-harness-en-practica.md)

---
*¿Te pareció demasiado proceso? Léelo otra vez entendiendo que cada regla evita un bug/malentendido conocido. Se aflojan solo donde es seguro (cambios triviales).*