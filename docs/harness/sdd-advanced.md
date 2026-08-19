# Advanced SDD — Flujo SDD Avanzado

**Version:** 0.1.0
**Ultima actualizacion:** [DATE]

---

## Que es SDD?

SDD (Specification-Driven Development) es un patron donde la **especificacion** es el contrato central entre el architect y los developers. El architect no dice como implementar — define QUÉ se debe hacer, y los developers deciden COMO.

### Por que SDD?

| Sin SDD | Con SDD |
|---------|---------|
| "Haz un login page" | Spec con acceptance criteria claros |
| El arquitecto micromanagea | El arquitecto solo valida contra la spec |
| Imposible saber si se hizo "bien" | Criterios verificables antes de escribir codigo |
| Cada agente hace lo que quiera | Todos leen la misma spec y la siguen |

---

## Flujo SDD Basico

```
1. ANALYZE  → Architect analiza la peticion
2. SPEC     → Spec-writer crea/actualiza spec
3. IMPLEMENT → Developers implementan (TDD en backend)
4. REVIEW   → Code-reviewer verifica (2 ejes)
5. DOCS     → Docs-auditor verifica docs
6. DECIDE   → Architect: PASS (commit) o FAIL (iterar)
```

---

## SDD Avanzado — Integrando MCPs

### Nivel 1: SDD + CodeGraph

Usa CodeGraph antes de escribir la spec para entender el codebase:

```
Architect: "Quiero implementar feature X"
       │
       ▼
┌─────────────────────┐    ┌──────────────────┐
│ codegraph_explore   │───→│ "El codebase ya  │
│ query="login flow"  │    │ tiene auth en     │
└─────────────────────┘    │ src/auth/*.ts"    │
                           └────────┬─────────┘
                                    ▼
                             2. SPEC (ya tiene contexto)
```

#### Cuando usar CodeGraph en sdd

| Paso SDD | Uso de CodeGraph |
|----------|-----------------|
| **Analize** | Explorar codebase existente para entender que ya hay |
| **Implement** | Verificar que el implementer entienda los simbolos relevantes |
| **Review** | Verificar que no se rompio ni un simbolo dependiente |

#### Ejemplos de queries comunes

```
# Entender una feature existente
codegraph_explore(query="authentication flow from login to token")

# Verificar impacto de un cambio
codegraph_explore(query="who calls calculateTotal?")

# Entender como funciona X del UI al DB
codegraph_explore(query="how does the checkout flow work from UI to API to DB")
```

### Nivel 2: SDD + Context7

Usa Context7 para la spec — verificar si las APIs/librerias que piensas usar existen y como se usan:

```
Architect: "Quiero usar NextApp Router middleware para auth"
       │
       ▼
┌──────────────────────┐    ┌──────────────────────────┐
| context7 query       |───→|"En App Router, el middleware│
| "Next App Router"    |    │  se define en middleware.ts│
│                      |    │  y se exporta como default" │
└──────────────────────┘    └─────────┬────────────────┘
                                      ▼
                               2. SPEC (con info correcta)
```

#### Cuándo usar Context7 en SDD

| Situacion | Uso |
|-----------|-----|
- Escribiendo spec con una libreria que no conoces | `context7 "Next.js middleware auth"` |
- Usando una version nueva de libreria | `context7 "Next 14 App Router middleware auth"`  |
- Implementando un patrino complejo | `context7 "React useEffect cleanup pattern"`|

### Nivel 3: SDD + Engram

Usa Engram para recordar decisiones pasadas de sdd. Antes de empezar un nuevo ciclo sdd:

```
Architect: "Quiero implementar feature X"
       │
       ▼
┌──────────────────────┐    ┌──────────────────────┐
│ mem_search(query="X")│───→│"Ya implementaste auth│
│                      │    │  en [DATE]. Esos      │
│                      │    │  cambios estan en     │
│                      │    │  src/auth/*.ts"       │
└──────────────────────┘    └─────────┬─────────────┘
                                      ▼
                               2. SPEC (ya sabe lo que existia)
```

#### Cuándo usar Engram en SDD

| Situacion | Uso |
|-----------|-----|
- Empezando una sesion nueva | `mem_session_summary` de la sesion anterior |
- Antes de tomar una decision arquitectonica | `mem_search(query="decisions X Y")` |
- Al final del dia/session | `mem_session_summary` para persistir lo hecho |

---

## Flujo SDD Combiando Todo

```
┌─────────────────────────────────────────────┐
│ 1. ANALYZE WITH TOOLS                        │
│                                              │
│  mem_search(query="related past work")       │
│  codegraph_explore(query="related codebase") │
│  context7.query(query="relevant APIs")       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 2. SPEC (con contexto de 3 sources)          │
│                                              │
│  - mem_search: que se hizo antes             │
│  - codegraph: que existe en el codice       │
│  - context7: que APIs usar                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 3. IMPLEMENT WITH TOOLS                      │
│                                              │
│  codegraph_explore(query="symbols to change")│
│  context7.query(query="API usage")           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. REVIEW WITH CODEGRAPH                     │
│                                              │
│  codegraph_explore(query="impact of change") │
│  code-reviewer.verdict: PASS/FAIL            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 6. DECIDE + LEARN                            │
│                                              │
│  - mem_save(decision)                        │
│  - mem_session_summary()                     │
│  - commit                                    │
└─────────────────────────────────────────────┘
```

---

## Patrones Avanzados

### Patrón 1: Iteracion Rapida sobre Bug Fix

```
1. ANALYZE → mem_search(query="related bugs")
           → codegraph_explore(query="buggy code + callers")
2. SPEC → Bug spec: "Antes de X, ocurre Y. Despues de fix, debe hacer Z"
3. IMPLEMENT → Fix con test (TDD si es logica pura)
4. REVIEW → codegraph_explore(query="impact of fix")
           → PASS if no impact en otros code
5. mem_save(bug fix)
6. commit
```

### Patrón 2: Implementando Feature Nueva en Codebase Existente

```
1. ANALYZE → codegraph_explore(query="how existing features work")
           → mem_search(query="future plans for X")
           → context7.query(query="best practices for X")
2. SPEC → New feature spec (usa el conocimiento de 1)
3. IMPLEMENT → Devs siguen spec (codegraph for symbol understanding)
4. REVIEW → codegraph_explore(query="new code + callers")
           → code-reviewer.verdict
5. mem_save(feature)
6. commit
```

### Patrón 3: Refactoring con Safety

```
1. ANALYZE → codegraph_explore(query="what does X affect?")
           → mem_search(query="decisions about X")
2. SPEC → Refactor spec: "Mover X de A a B sin cambiar comportamiento"
   - List todos los callers que se veran afectados
   - Especifica que el comportamiento NO cambia
   - Tests de regression obligatorios
3. IMPLEMENT → Devs refactoren (TDD — tests de regression antes de todo)
4. REVIEW → codegraph_explore(query="callers of refactored code")
           → Verificar que ningun caller se rompio
5. mem_save(refactor)
6. commit
```

---

## Checklist Avanzado de SDD

Antes de commitear, verifica:

- [ ] Se usó codegraph para entender el impacto del cambio?
- [ ] Se consultó context7 si se usan APIs/librerias externas?
- [ ] Se uso mem_search antes de empezar para ver si habia trabajo previo?
- [ ] Se guardó mem_session_summary al final?
- [ ] Se hizo un codegraph_explore query sobre el impacto del fix?
- [ ] Los tests de regression pasan?
- [ ] La spec cumple todos los acceptance criteria?

---

## Comandos Utiles

### CodeGraph

```
# Explorar flow/architectura
codegraph_explore(query="authentication flow")

# Impacto de un cambio
codegraph_explore(query="who calls calculateTotal")

# Entender como funciona X
codegraph_explore(query="how does checkout work from UI to DB")
```

### Context7

```
# Buscar docs de libreria
context7.query(libraryId="react", query="useEffect cleanup function")

# Verificar API version nueva
context7.query(libraryId="nextjs", query="app router middleware 2026")
```

### Engram

```
# Buscar trabajo previo
mem_search(query="related past work")

# Guardar decision
mem_save(title="Used middleware for auth", type="decision")

# Guardar sesion
mem_session_summary(content="...")
```

---

## Errores Comunes

### Error 1: Usar todos los MCPs a la vez

**Problema:** Cada MCP anade tokens al contexto.
**Solucion:** Solo activar los necesarios para la tarea:
- Bug fix simple: solo codegraph
- Implementar con API nueva: codegraph + context7
- Multi-session: codegraph + memery

### Error 2: No usar codegraph antes de implementar

**Problema:** Los developers implementan sin entender el codebase.
**Solucion:** Siempre antes de implementar, hacer un `codegraph_explore` de la funcion/flow que se va a tocar.

### Error 3: No documentar con Engram

**Problema:** Sesiones no conectadas, cada agente empieza desde cero.
**Solucion:** Guardar `mem_session_summary` al final de cada sesion y `mem_save` para decisiones importantes.

---

## Recursos

- [SDD basic flow](../features/_template.md)
- [CodeGraph MCP docs](MCP-integration.md#codegraph)
- [Context7 MCP docs](MCP-integration.md#context7)
- [Engram MCP docs](MCP-integration.md#engram)
- [Agent patterns](agents-patterns.md)

---

_Esta guia se actualiza con nuevos patrones avanzados y mejores practicas._