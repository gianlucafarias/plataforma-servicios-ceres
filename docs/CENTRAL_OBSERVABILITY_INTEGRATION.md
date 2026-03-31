# Integracion con observabilidad central (`ceres-api`)

## Objetivo

`plataforma-servicios-ceres` mantiene su auditoria local (`AuditEvent`) y
ademas emite una copia central a `ceres-api`. Los emails dejan de enviarse
localmente y pasan a encolarse en el backend central.

## Que sigue local

- tabla `AuditEvent`
- endpoints locales de observabilidad
- reglas de negocio para decidir si se envia o se saltea un correo

## Que pasa a `ceres-api`

- storage central multi-servicio (`ops_event_log`)
- resumenes cross-servicio
- cola Redis de emails
- providers `Resend` + `SMTP`
- trazabilidad central `requested/sent/failed/skipped`

## Variables requeridas en plataforma

```dotenv
CERES_API_BASE_URL=
CERES_API_OPS_API_KEY=
CENTRAL_OBSERVABILITY_TIMEOUT_MS=2500
```

Fallbacks soportados para la API key:

- `CERES_API_OPS_API_KEY`
- `OPS_API_KEY`
- `ADMIN_API_KEY`

## Flujos migrados

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/verify/resend`
- `PUT /api/admin/professionals/[id]/status`

## Contratos usados

### Mirror de eventos

`safeRecordAuditEvent()`:

1. persiste en Prisma local
2. registra metricas locales
3. emite `POST /api/v1/ops/events` en modo `best effort`

Si `ceres-api` falla o timeoutea:

- la request de negocio no se rompe
- la auditoria local queda guardada

### Jobs de email

Las funciones de `src/jobs/email.producer.ts` ya no envian correo directo.
Ahora hacen `POST /api/v1/ops/jobs/email` con:

- `templateKey`
- `recipient`
- `payload`
- `idempotencyKey`
- `requestId`
- `actor`
- `entityType`
- `entityId`

## Reglas de negocio

- `DISABLE_EMAIL_VERIFICATION=true`
  - se registra `skipped` local
  - el evento local se espeja al central
  - no se encola job
- token faltante u otro prerequisito ausente
  - mismo criterio: `skipped` local + mirror central

## Notas de seguridad

- la plataforma no necesita `RESEND_API_KEY`
- la plataforma no necesita `SMTP_*`
- las credenciales de correo viven solo en `ceres-api`
- los `idempotencyKey` no deben incluir tokens o URLs en claro

## Operacion

- el dashboard central consume `ceres-api` con `source=plataforma-servicios-ceres`
- los endpoints locales siguen disponibles como fallback tecnico
- no se agregan Redis ni colas locales a este proyecto
