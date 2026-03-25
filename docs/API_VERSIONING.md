# API Versioning & Surface Ownership

## Estado actual
`/api/v1` ya es la superficie objetivo para clientes app-facing del producto principal. La migracion del frontend publico y del dashboard profesional se hizo sobre `v1`, manteniendo `legacy` solo como compatibilidad temporal mientras existan consumidores pendientes.

## Superficies que ya tienen equivalente en `v1`
- Auth publica:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/complete-profile`
  - `POST /api/v1/auth/verify`
  - `POST /api/v1/auth/verify/resend`
  - `POST /api/v1/auth/password/forgot`
  - `POST /api/v1/auth/password/reset`
  - `GET /api/v1/auth/check-email`
- Uploads compartidos:
  - `POST /api/v1/upload/grant`
  - `POST /api/v1/upload`
  - `POST /api/v1/upload/external`
- Support:
  - `POST /api/v1/support/contact`
  - `POST /api/v1/support/category-suggestions`
- Profesionales:
  - `GET /api/v1/professionals`
  - `GET /api/v1/professional/[id]`
  - `POST /api/v1/professional/[id]/view`
  - `GET /api/v1/professional/me`
  - `GET /api/v1/professional/schedule`
  - `GET /api/v1/professional/stats`
  - `GET /api/v1/professional/certifications`
- Servicios:
  - `GET /api/v1/services`
  - `POST /api/v1/services`
  - `GET /api/v1/services/[id]`
  - `PUT /api/v1/services/[id]`
  - `DELETE /api/v1/services/[id]`
  - `GET /api/v1/services/stats`
- Otras superficies publicas:
  - `GET /api/v1/categories`
  - `POST /api/v1/bug-reports`

## Superficies que permanecen fuera de `v1`
Estas rutas siguen sin versionado por ser internas, operativas o ajenas al contrato publico del producto:
- `/api/admin/*`
- `/api/debug/*`
- `/api/docs*`
- `/api/health`
- `/api/ceres-en-red/*`
- `/api/auth/logout`

## Regla operativa
- Todo cliente app-facing nuevo o migrado debe consumir `/api/v1/*`.
- No agregar nuevas llamadas directas a `/api/*` legacy en el frontend principal.
- El borrado de handlers legacy duplicados debe hacerse en un PR separado, solo despues de confirmar que no quedan consumidores reales.

## Panel externo
El panel externo `dashboard-ceres` usa intencionalmente `/api/admin/*` a traves de su proxy `app/api/servicios-externos/[...path]`. Esa superficie sigue siendo legacy por diseño y no debe migrarse a `v1` hasta que exista una API admin versionada.

Excepcion importante:
- el panel externo todavia usa uploads compartidos por `/api/upload/grant` y `/api/upload`
- esos endpoints si tienen version `v1`
- antes de eliminar los uploads legacy, el panel externo debe adaptarse a `/api/v1/upload/grant` y `/api/v1/upload`
- esa migracion requiere ajustar el adapter del panel porque el envelope `v1` devuelve `data` y `meta`, no el shape legacy plano

## Envelope estandar de `v1`
Respuesta exitosa:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid-or-header"
  }
}
```

Respuesta con error:
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Descripcion legible",
    "details": { "...": "opcional" }
  },
  "meta": {
    "requestId": "uuid-or-header"
  }
}
```

## OpenAPI
- La especificacion `docs/openapi-v1.yaml` sigue siendo parcial y no cubre todavia toda la superficie `v1` listada arriba.
- Antes de publicar o usar esa spec como fuente de verdad para integraciones, hay que ampliarla para incluir auth publica completa, uploads, support, professionals, services stats y dashboard profesional.
