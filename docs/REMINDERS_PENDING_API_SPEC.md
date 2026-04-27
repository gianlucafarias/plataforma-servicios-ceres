# API de pendientes de recordatorios

## Objetivo

Exponer por API, desde `plataforma-servicios-ceres`, los candidatos pendientes de recordatorio para que `ceres-api` los consuma y centralice el envio de emails (`/api/v1/ops/jobs/email`).

Este endpoint **no envia emails**. Solo calcula y entrega pendientes segun reglas de negocio de la plataforma.

## Endpoint

- `GET /api/v1/ops/reminders/pending`

## Autenticacion

Mismo patron de endpoints operativos:

- Header `x-api-key` obligatorio.
- Key valida: `OPS_API_KEY` o `ADMIN_API_KEY` (fallback ya usado en este proyecto).
- Respuesta `401` si falta o es invalida.

## Query params

- `type` (required):  
  - `verify_account`
  - `missing_criminal_record`
- `window` (required):  
  - `d1` (24h)
  - `d3` (72h)
  - `d7` (7 dias)
- `limit` (optional): default `100`, max `1000`
- `cursor` (optional): paginacion basada en `createdAt`/`id`

## Reglas de negocio

## 1) `type=verify_account`

Incluir usuarios que cumplan:

- `user.verified = false`
- email valido/no vacio
- edad de cuenta dentro o por encima de la ventana pedida (`window`)
- aun no enviados recordatorios para esa ventana (idempotencia por key)

Excluir:

- usuarios ya verificados
- usuarios sin email valido

## 2) `type=missing_criminal_record`

Incluir profesionales que cumplan:

- `professional.requiresDocumentation = true`
- documento penal no cargado (`criminalRecordObjectKey` ausente)
- email de usuario asociado valido
- edad de registro dentro o por encima de la ventana pedida (`window`)
- aun no enviados recordatorios para esa ventana (idempotencia por key)

Excluir:

- profesionales que ya subieron certificado penal
- profesionales sin email de usuario

## Contrato de respuesta

```json
{
  "success": true,
  "data": [
    {
      "entityType": "user",
      "entityId": "usr_123",
      "email": "usuario@dominio.com",
      "firstName": "Juan",
      "templateKey": "services.reminder_verify_account",
      "payload": {
        "verificationUrl": "https://ceres.gob.ar/auth/verify?token=abc&email=usuario%40dominio.com"
      },
      "idempotencyKey": "reminder.verify_email:usr_123:d1",
      "source": "plataforma-servicios-ceres",
      "domain": "auth.email",
      "summary": "Recordatorio de verificacion de cuenta (d1)"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "limit": 100
  }
}
```

## Campos por item

- `entityType`: `user` | `professional`
- `entityId`: id de entidad de negocio
- `email`: destinatario final (sin enmascarar, backend la enmascara al loguear)
- `firstName`: opcional
- `templateKey`:
  - `services.reminder_verify_account`
  - `services.reminder_missing_criminal_record`
- `payload`: datos para render de template (urls y campos dinamicos)
- `idempotencyKey`: clave unica por entidad+ventana
- `source`: `plataforma-servicios-ceres`
- `domain`: `auth.email` | `professional.documentation`
- `summary`: descripcion legible para timeline

## Errores

- `400` parametros invalidos (`type/window/limit`)
- `401` api key invalida o ausente
- `500` error interno

Formato estandar envelope:

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Parametro type invalido"
  },
  "meta": {
    "requestId": "..."
  }
}
```

## Idempotencia y deduplicacion

La plataforma devuelve `idempotencyKey` estable por ventana:

- `reminder.verify_email:<userId>:d1|d3|d7`
- `reminder.criminal_record:<professionalId>:d1|d3|d7`

`ceres-api` usa esa key en su cola (`ops:email:idempotency:*`) para evitar duplicados.

## Observabilidad esperada en `ceres-api`

Eventos por template:

- `.requested`
- `.sent`
- `.failed`
- `.skipped`

## Ejemplos de consumo (backend)

```bash
curl -s -H "x-api-key: <OPS_API_KEY>" \
  "https://plataforma.ceres.gob.ar/api/v1/ops/reminders/pending?type=verify_account&window=d1&limit=200"
```

```bash
curl -s -H "x-api-key: <OPS_API_KEY>" \
  "https://plataforma.ceres.gob.ar/api/v1/ops/reminders/pending?type=missing_criminal_record&window=d3&cursor=<token>"
```

## No objetivos

- No enviar email directo desde plataforma.
- No agregar provider logic (Resend/SMTP) en este endpoint.
- No introducir nuevas variables de entorno salvo que sea estrictamente necesario en implementacion posterior.
