# Integracion del Panel Externo `dashboard-ceres`

## Estado actual
El panel externo ubicado en `D:/Proyectos/ceresito/dashboard/dashboard-ceres` consume dos superficies del backend de `ceresenred`:

- API admin interna:
  - `/api/admin/*`
  - acceso via el proxy local `app/api/servicios-externos/[...path]`
  - ejemplo: `app/(dashboard)/dashboard/servicios/_lib/api-client.ts`
- Uploads compartidos versionados:
  - `/api/v1/upload/grant`
  - `/api/v1/upload`

## Estado actual del modulo de categorias
El panel de categorias ya esta alineado con el backend actual para:

- areas de oficios
- subcategorias hijas de oficios
- profesiones
- imagenes (`backgroundUrl`)
- iconos (`icon`)
- visibilidad en inicio (`showOnHome`)

La API admin sigue fuera de `v1` por diseno. La superficie publica del sitio continua leyendo categorias desde `/api/v1/categories`.

Rutas observadas en el panel externo:
- `GET /api/admin/stats`
- `GET /api/admin/professionals`
- `GET /api/admin/professionals/[id]`
- `PUT /api/admin/professionals/[id]`
- `PUT /api/admin/professionals/[id]/status`
- `GET /api/admin/users`
- `GET /api/admin/categories`
- `GET /api/admin/categories/[id]`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/[id]`
- `DELETE /api/admin/categories/[id]`
- `GET /api/admin/bug-reports`
- `GET /api/admin/certifications`

## Uploads compartidos
El panel externo ya usa `v1` para uploads:

- `POST /api/v1/upload/grant`
- `POST /api/v1/upload`

El adapter del panel ya parsea el envelope versionado:

- `POST /api/v1/upload/grant`
  - respuesta: `{ success, data: { token, expiresAt }, meta }`
- `POST /api/v1/upload`
  - respuesta: `{ success, data: { filename, originalName, path, url, value, storage }, meta }`

Archivos relevantes:
- `app/(dashboard)/dashboard/servicios/_lib/api-client.ts`
- `app/(dashboard)/dashboard/servicios/categorias/page.tsx`

## Observacion importante
Hoy el panel externo solicita upload grants con:

```json
{
  "context": "register",
  "type": "image"
}
```

Eso funciona tecnicamente, pero sigue acoplado al flujo publico de registro. Si el panel externo va a sostener uploads admin a largo plazo, conviene evaluar un contexto de upload admin dedicado en una etapa posterior.

## Requisitos para despliegue coordinado
Para liberar el modulo de categorias sin sorpresas:

1. desplegar primero o en simultaneo el backend `plataforma-servicios-ceres`
2. confirmar que la migracion de Prisma aplicada incluya `categories.showOnHome`
3. definir `R2_PUBLIC_BASE_URL` en el frontend publico para que `next/image` habilite el host remoto
4. desplegar el panel `dashboard-ceres` con:
   - `NEXT_PUBLIC_SERVICES_API_URL`
   - `ADMIN_API_KEY`
5. probar en el panel:
   - upload de imagen
   - cambio de icono
   - cambio de `showOnHome`
6. verificar en el sitio publico:
   - carrusel del home
   - bloque de profesiones del home
