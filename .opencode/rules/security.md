# Reglas de Seguridad

## Principio Fundamental

Protege credenciales, datos de usuarios y accesos sensibles. Ajusta el nivel de seguridad a la sensibilidad real de los datos que maneja el proyecto.

## Prohibiciones Absolutas

1. **NUNCA hardcodear credenciales**
   - No passwords, tokens, API keys, URLs de produccion en codigo
   - Variables de entorno OBLIGATORIAS para todo lo sensible
   - Si encuentras un fallback hardcoded, conviertelo en obligatorio

2. **NUNCA exponer credenciales de servicios**
   - No admin email/password en codigo cliente
   - No service account tokens en repositorio
   - Los datos de auth van en variables de entorno

3. **NUNCA exponer datos de usuarios**
   - No nombres/emails/telefonos en logs
   - No datos personales en repositorio
   - Los formularios deben validar inputs

4. **NUNCA desactivar autenticacion**
   - No comentar auth "temporalmente para probar"
   - Las rutas protegidas SIEMPRE requieren auth

## Reglas de Implementacion

### Variables de Entorno

TODAS las configuraciones sensibles deben usar variables de entorno:

```typescript
// Bien
const API_URL = process.env.API_URL;
if (!API_URL) throw new Error("API_URL is required");

// Mal
const API_URL = process.env.API_URL || "http://localhost:8090";
```

### Logs

```typescript
// Bien
logger.info(`Resource ${resourceId} updated`);

// Mal
logger.info(`User ${userName} (${userEmail}) performed action on ${resourceId}`);
```

## Checklist de Seguridad Antes de Comitear

- [ ] No hay credenciales en codigo (`git grep -iE "password|secret|token|api_key"`)
- [ ] No hay datos de usuarios reales en el repo
- [ ] Las variables de entorno son obligatorias (sin fallbacks reales)
- [ ] Rutas protegidas requieren autenticacion
- [ ] No hay URLs de produccion hardcodeadas

## Reportar Problemas

Si detectas un problema de seguridad:
1. ALERTA INMEDIATA al usuario
2. Documenta el riesgo (probabilidad x impacto)
3. Propone solucion con esfuerzo estimado
4. No lo arregles solo sin consenso si es arquitectonico
