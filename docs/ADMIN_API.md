# API de Administración

Este documento describe los endpoints REST disponibles para el panel de administración externo. Todos los endpoints requieren autenticación mediante API Key.

## Autenticación

Todas las peticiones deben incluir el header:
```
x-admin-api-key: <ADMIN_API_KEY>
```
O alternativamente:
```
Authorization: Bearer <ADMIN_API_KEY>
```

El `ADMIN_API_KEY` debe configurarse en la variable de entorno `ADMIN_API_KEY` del servidor.

---

## Endpoints

### Profesionales

#### `GET /api/admin/professionals`
Lista profesionales con filtros y paginación.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status`: `active`, `pending`, `suspended`
- `grupo`: `oficios`, `profesiones`
- `search`: búsqueda por nombre, email, bio

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### `GET /api/admin/professionals/[id]`
Obtiene detalles completos de un profesional.

#### `PUT /api/admin/professionals/[id]/status`
Actualiza el estado y verificación de un profesional.

**Body:**
```json
{
  "status": "active" | "pending" | "suspended",
  "verified": true | false
}
```

**Nota:** Este endpoint envía notificaciones automáticas a Slack cuando:
- Se aprueba un profesional (status: `pending` → `active`)
- Se suspende un profesional

#### `PUT /api/admin/professionals/[id]`
Actualiza información completa del profesional.

---

### Usuarios

#### `GET /api/admin/users`
Lista usuarios con filtros y paginación.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `role`: `citizen`, `professional`, `admin`
- `verified`: `true`, `false`
- `search`: búsqueda por email, nombre

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "role": "professional",
      "verified": true,
      "professional": {
        "id": "...",
        "status": "active",
        "verified": true
      },
      "stats": {
        "contactRequests": 5,
        "reviews": 10,
        "hasProfessional": true
      }
    }
  ],
  "pagination": {...}
}
```

#### `GET /api/admin/users/[id]`
Obtiene detalles completos de un usuario (incluye profesional, reviews, contact requests, etc.).

#### `PUT /api/admin/users/[id]`
Actualiza información de un usuario.

**Body:**
```json
{
  "role": "citizen" | "professional" | "admin",
  "verified": true | false,
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "birthDate": "YYYY-MM-DD"
}
```

---

### Categorías

#### `GET /api/admin/categories`
Lista categorías (áreas y subcategorías).

**Query params:**
- `type`: `area`, `subcategory`
- `group`: `oficios`, `profesiones`
- `search`: búsqueda por nombre o slug

**Respuesta (sin filtros):**
```json
{
  "success": true,
  "data": {
    "areas": [...],
    "subcategoriesOficios": [...],
    "subcategoriesProfesiones": [...],
    "stats": {
      "totalAreas": 10,
      "totalSubcategoriesOficios": 50,
      "totalSubcategoriesProfesiones": 30,
      "totalCategories": 90
    }
  }
}
```

#### `POST /api/admin/categories`
Crea una nueva categoría o área.

**Body:**
```json
{
  "type": "area" | "subcategory",
  "name": "...",
  "slug": "...",
  "group": "oficios" | "profesiones",
  "parentId": "...", // Solo para subcategorías de oficios
  "description": "...",
  "image": "...",
  "active": true
}
```

#### `GET /api/admin/categories/[id]`
Obtiene detalles de una categoría.

#### `PUT /api/admin/categories/[id]`
Actualiza una categoría.

**Body:**
```json
{
  "name": "...",
  "description": "...",
  "image": "...",
  "active": true | false,
  "parentId": "..." | null
}
```

#### `DELETE /api/admin/categories/[id]`
Elimina o desactiva una categoría.

**Query params:**
- `force=true`: fuerza eliminación incluso si tiene subcategorías/servicios
- `deactivate=true`: solo desactiva (soft delete)

---

### Bug Reports

#### `POST /api/bug-reports`
Endpoint **público** para reportar bugs (no requiere API key).

**Body:**
```json
{
  "title": "...",
  "description": "...",
  "severity": "low" | "medium" | "high" | "critical",
  "userEmail": "...", // Opcional
  "context": { // Opcional: info técnica
    "browser": "...",
    "os": "...",
    "url": "..."
  }
}
```

**Nota:** Este endpoint envía notificaciones automáticas a Slack.

#### `GET /api/admin/bug-reports`
Lista bug reports con filtros.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status`: `open`, `in_progress`, `resolved`, `closed`
- `severity`: `low`, `medium`, `high`, `critical`
- `search`: búsqueda en título, descripción, email

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "status": "open",
      "severity": "high",
      "userEmail": "...",
      "context": {...},
      "adminNotes": "...",
      "resolvedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {...}
}
```

#### `GET /api/admin/bug-reports/[id]`
Obtiene detalles completos de un bug report.

#### `PUT /api/admin/bug-reports/[id]`
Actualiza un bug report (cambiar estado, agregar notas, etc.).

**Body:**
```json
{
  "status": "open" | "in_progress" | "resolved" | "closed",
  "severity": "low" | "medium" | "high" | "critical",
  "adminNotes": "..."
}
```

**Nota:** Si se cambia el estado a `resolved` o `closed`, se actualiza automáticamente `resolvedAt`.

---

### Certificaciones profesionales

#### `GET /api/admin/certifications`
Lista certificaciones profesionales cargadas por los usuarios.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status`: `pending`, `approved`, `rejected`, `suspended` (opcional)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "professionalId": "prof-id",
      "categoryId": "cat-id | null",
      "certificationType": "matricula | certificado | licencia | curso | otro",
      "certificationNumber": "12345",
      "issuingOrganization": "Colegio de Abogados de Santa Fe",
      "issueDate": "2025-01-01T00:00:00.000Z",
      "expiryDate": "2028-01-01T00:00:00.000Z",
      "documentUrl": "https://.../certificados/123.pdf",
      "status": "pending | approved | rejected | suspended",
      "adminNotes": "Motivo de rechazo/suspensión (opcional)",
      "reviewedAt": "2025-01-10T00:00:00.000Z",
      "createdAt": "...",
      "updatedAt": "...",
      "professional": {
        "id": "prof-id",
        "user": {
          "id": "user-id",
          "firstName": "Juan",
          "lastName": "Pérez",
          "email": "juan@example.com"
        }
      },
      "category": {
        "id": "cat-id",
        "name": "Electricista",
        "slug": "electricista"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

#### `PUT /api/admin/certifications/[id]`
Actualiza el estado de una certificación.

**Body:**
```json
{
  "status": "approved" | "rejected" | "suspended",
  "adminNotes": "Motivo o comentario interno (opcional)"
}
```

**Comportamiento:**
- `approved`: marca la certificación como aprobada.  
  - Si el profesional tiene al menos una certificación aprobada, se marca su perfil como `verified = true`.
- `rejected`: la solicitud queda rechazada (por ejemplo, datos inválidos, documento incorrecto).
- `suspended`: certificación previamente aprobada que se deshabilita (por ejemplo, matrícula vencida o retirada).

#### `DELETE /api/admin/certifications/[id]`
Elimina una certificación (uso excepcional).

---

### Estadísticas

#### `GET /api/admin/stats`
Obtiene estadísticas generales de la plataforma.

**Query params:**
- `period`: `all`, `week`, `month` (para métricas de crecimiento)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProfessionals": 100,
      "activeProfessionals": 80,
      "pendingProfessionals": 15,
      "suspendedProfessionals": 5,
      "totalServices": 500,
      "totalUsers": 200,
      "totalCitizens": 100,
      "totalAdmins": 2,
      "totalContactRequests": 1000,
      "totalReviews": 250,
      "totalBugReports": 50,
      "openBugReports": 10,
      "activeLocations": 20
    },
    "growth": {
      "newProfessionalsThisWeek": 5,
      "newProfessionalsThisMonth": 20,
      "newUsersThisWeek": 10,
      "newUsersThisMonth": 40,
      "newServicesThisMonth": 50
    },
    "categoryDistribution": [
      {
        "category": "oficios",
        "count": 60
      },
      {
        "category": "profesiones",
        "count": 40
      }
    ],
    "topCategories": [...],
    "geographicDistribution": [...],
    "bugReportsBySeverity": [...],
    "contactRequestsByStatus": [...]
  }
}
```

---

## Notificaciones Automáticas

El sistema envía notificaciones automáticas a Slack (usando la cola configurada) para:

1. **Nuevo profesional registrado**: Cuando un profesional se registra con estado `pending`.
2. **Profesional aprobado**: Cuando se cambia el estado de `pending` a `active`.
3. **Profesional suspendido**: Cuando se suspende un profesional.
4. **Nuevo bug reportado**: Cuando se crea un bug report (endpoint público).

Las notificaciones se envían en background y no bloquean las respuestas de los endpoints.

---

## Manejo de Errores

Todos los endpoints devuelven errores en formato consistente:

```json
{
  "success": false,
  "error": "error_code",
  "message": "Mensaje descriptivo"
}
```

**Códigos de error comunes:**
- `unauthorized` (401): API Key faltante o inválida
- `forbidden` (403): API Key inválida
- `validation_error` (400): Datos inválidos
- `not_found` (404): Recurso no encontrado
- `conflict` (409): Conflicto (ej: slug duplicado, categoría con servicios asociados)
- `server_error` (500): Error interno

---

## Variables de Entorno Requeridas

- `ADMIN_API_KEY`: API Key para autenticar peticiones admin
- `SLACK_WEBHOOK_URL`: URL del webhook de Slack para notificaciones (opcional)
- `DATABASE_URL`: URL de conexión a PostgreSQL

---

## Ejemplo de Uso

```typescript
// Obtener profesionales pendientes
const response = await fetch('https://api.plataforma.com/api/admin/professionals?status=pending&page=1&limit=20', {
  headers: {
    'x-admin-api-key': process.env.ADMIN_API_KEY
  }
});

const data = await response.json();

// Aprobar un profesional
await fetch('https://api.plataforma.com/api/admin/professionals/123/status', {
  method: 'PUT',
  headers: {
    'x-admin-api-key': process.env.ADMIN_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'active',
    verified: true
  })
});
```
