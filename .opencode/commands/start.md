---
description: Carga el contexto completo del proyecto al inicio de sesion (git, memoria, salud). Solo lectura.
---

# /start — Ritual de Inicio de Sesion

## Descripcion

Carga el contexto completo del proyecto para que el agente sepa donde esta parado antes de pensar o actuar.

## Pasos de Ejecucion

### 1. Estado del repositorio

```bash
git branch --show-current 2>/dev/null || echo "no-git"
git log --oneline -3 2>/dev/null || echo "no-commits"
git status --short 2>/dev/null || echo "no-git"
```

### 2. Contexto de memoria

Leer estos archivos:

- `AGENTS.md` (identidad y prohibiciones)
- `docs/development/session-log.md` (ultimas 3 entradas)
- `docs/development/agent_memory.md` (ultimos 2 hallazgos)
- `docs/architecture/system_overview.md` (mapa arquitectonico)

### 3. Estado de salud rapido

Ejecutar el comando de build/check del proyecto (si existe). Ejemplos:

```bash
# Node/JS projects
npm run build 2>&1 | tail -5 || true
npm run typecheck 2>&1 | tail -5 || true

# Python projects
python -m py_compile src/*.py 2>&1 || true

# Si no hay comando de build, omitir
```

## Formato de Respuesta Obligatorio

```
🧠 [PROJECT_NAME] — Session Start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Rama: <rama_actual>
   Ultimos commits:
   - <hash> <mensaje>
   - <hash> <mensaje>
   - <hash> <mensaje>

🧠 Memoria de sesiones:
   - <fecha> - <titulo ultima sesion>
   - <fecha> - <titulo penultima sesion>

⚠️  Estado de salud:
   Build: <ok / errores conocidos / no-configurado>
   Git: <limpio / X archivos modificados>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Que queremos construir hoy?
```

## Notas

- Este command es de **solo lectura**. No edita ningun archivo.
- Si hay errores de build conocidos, mencionalos como advertencia pero no bloquees la sesion.
- Si el proyecto no usa git, omite la seccion de commits.
