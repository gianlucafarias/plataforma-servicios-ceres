# API Versioning & Envelope (v1)

## Context
Para evitar romper clientes existentes, se agrega una versión `v1` paralela a los endpoints actuales. Los endpoints legacy siguen funcionando sin cambios.

## Endpoints v1 añadidos
- `POST /api/v1/bug-reports`
- `GET  /api/v1/categories`

## Envelope estándar
Todas las respuestas v1 usan:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid-or-header"
  }
}
```
En caso de error:
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Descripción legible",
    "details": { "...": "opcional" }
  },
  "meta": { "requestId": "..." }
}
```

## Rate limiting (best effort)
- In-memory por instancia.
- `/api/v1/bug-reports`: 20 req / 10 min por IP.
- `/api/v1/categories`: 60 req / 5 min por IP.
- Cabeceras: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Compatibilidad
- Endpoints legacy **no cambian**.
- Migrar clientes a `/api/v1/...` para recibir envelope y errores consistentes.
- Si se necesitan campos adicionales en `meta` (p.ej. paginación), añadir sin romper.

## OpenAPI
- Especificación v1 en `docs/openapi-v1.yaml`.
- Servida en `/api/docs` (YAML) y `/api/docs/ui` (Swagger UI) solo en dev/stg. Para producción, habilitar con `ALLOW_API_DOCS=true`.

## Próximos pasos sugeridos
- Publicar `openapi.yaml` para v1.
- Añadir `X-Request-Id` generado por el edge/proxy para correlación.
- Evaluar mover rate limiting a capa shared (Redis/PgBouncer) para entornos serverless.
