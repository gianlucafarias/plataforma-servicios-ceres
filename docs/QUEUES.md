# Sistema de Colas y Workers

## Arquitectura

Este proyecto utiliza **BullMQ** sobre **Redis** para procesamiento asíncrono de jobs con las siguientes características:

- **Semántica**: Al menos una vez (at-least-once delivery)
- **Idempotencia**: Jobs con `jobId` determinístico evitan duplicados
- **Retries**: 5 intentos con backoff exponencial (1s, 5s, 15s, 60s, 300s)
- **DLQ**: Jobs que agotan reintentos envían alerta a Slack
- **Crons**: Tareas programadas con timezone America/Argentina/Cordoba

## Colas Disponibles

### 1. Email Queue (`email`)
**Jobs:**
- `verify`: Envío de email de verificación de cuenta
- `welcome`: Email de bienvenida post-verificación
- `newsletter`: (futuro) Envío de newsletters

**Configuración:**
- Concurrencia: 5
- Reintentos: 5 con backoff exponencial
- Cleanup: Completados (1h), Fallos (24h)

### 2. Slack Queue (`slack`)
**Jobs:**
- `alert`: Alertas de errores, DLQ, mantenimiento

**Configuración:**
- Concurrencia: 10 (alta para alertas)
- Reintentos: 3 con backoff fijo (2s)
- No envía a Slack en caso de fallo (evita loops)

### 3. Maintenance Queue (`maintenance`)
**Jobs:**
- `clean-verification-tokens`: Limpieza de tokens vencidos (cron: cada hora)
- `daily-report`: Reporte diario de métricas (cron: 09:00 AM)

**Configuración:**
- Concurrencia: 1 (tareas secuenciales)
- Crons con timezone configurada

### 4. Files Queue (`files`)
**Jobs:**
- (futuro) `validate-cv`: Validación de CVs
- (futuro) `optimize-profile-picture`: Optimización de imágenes

## Uso

### Encolar Jobs (Productores)

```typescript
import { enqueueEmailVerify } from '@/jobs/email.producer';

// Encolar email de verificación
await enqueueEmailVerify({
  userId: 'user-123',
  token: 'abc123',
  email: 'user@example.com',
  firstName: 'Juan',
});
```

### Procesar Jobs (Workers)

Los workers se ejecutan como procesos separados manejados por PM2:

```bash
# Desarrollo
npm run worker:dev

# Producción (después de build)
npm run worker:start
```

## Dashboard Bull Board

Interfaz web para monitorear colas en tiempo real:

```bash
# Desarrollo
npm run queues:ui:dev

# Producción
npm run queues:ui:start
```

**Acceso:**
- URL: http://127.0.0.1:3050/ui
- Usuario: `admin`
- Contraseña: valor de `QUEUES_UI_PASS`

**IMPORTANTE**: En producción, proteger con Nginx y/o restricción de IPs.

## Configuración Redis

### Variables de Entorno

```env
REDIS_URL=
REDIS_PREFIX=ceres:
TZ=America/Argentina/Cordoba
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
QUEUES_UI_PASS=
```

### Aislamiento

- **DB Lógica**: Usa DB 5 para separar colas del resto de Redis
- **Prefix**: Todas las keys tienen prefijo `ceres:queue:`
- **Conexión**: Compartida entre productores y workers

## PM2 (Producción)

El archivo `ecosystem.config.js` define 3 procesos:

1. **plataforma-servicios-ceres**: App Next.js (cluster mode)
2. **ceres-worker**: Procesa jobs de las colas (fork mode)
3. **ceres-queues-ui**: Dashboard Bull Board (fork mode)

### Comandos PM2

```bash
# Listar procesos
pm2 list

# Ver logs
pm2 logs ceres-worker
pm2 logs ceres-queues-ui

# Restart individual
pm2 restart ceres-worker

# Restart todos
pm2 restart all

# Monitoreo
pm2 monit
```

## Deploy (GitHub Actions)

El workflow `.github/workflows/deploy.yml` automáticamente:

1. Instala dependencias
2. Ejecuta migraciones de Prisma
3. Compila código (Next.js + scripts con tsup)
4. Reinicia/inicia los 3 procesos PM2

## Testing

### Test Unitario (Productores)

```bash
npm run test:unit -- email.producer.test.ts
```

Valida:
- Idempotencia por `jobId`
- Configuración de reintentos
- Parámetros correctos

### Test de Integración (Workers)

```bash
# (Futuro) Con Redis en Docker o ioredis-mock
npm run test:int -- email.worker.test.ts
```

## Garantías y Patrones

### Idempotencia

Los jobs usan `jobId` determinístico basado en datos del negocio:

```typescript
jobId: `email:verify:${userId}` // Mismo userId = mismo job
```

Si se encola 2 veces el mismo `userId`, BullMQ ignora el duplicado.

### Semántica "Al Menos Una Vez"

BullMQ garantiza que el job se ejecutará, pero puede ejecutarse más de una vez en caso de fallos de red o crashes. Por eso:

1. **Productores**: Usan `jobId` para evitar encolar duplicados
2. **Workers**: Deben ser idempotentes (checks en DB, upserts)

Ejemplo en `email.worker.ts`:
```typescript
// Validar que el token exista antes de enviar
const vt = await prisma.verificationToken.findFirst({...});
if (!vt) return; // No reintentar
```

### Dead Letter Queue (DLQ)

Jobs que agotan los 5 reintentos:
1. Quedan en estado `failed` en Redis
2. `QueueEvents` detecta el fallo final
3. Se envía alerta a Slack con `jobId` y razón
4. Se puede reintentar manualmente desde Bull Board

### Retries y Backoff

Configuración estándar:
- **Attempts**: 5
- **Backoff**: Exponencial con delay inicial 1s
- **Delays**: 1s → 5s → 15s → 60s → 300s (total ~6 min)

Evita saturar servicios externos (SMTP, Slack) en caso de errores transitorios.

## Troubleshooting

### Worker no arranca

```bash
# Verificar logs
pm2 logs ceres-worker --lines 100

# Verificar Redis
redis-cli -n 5 PING
redis-cli -n 5 KEYS "ceres:queue:*"

# Verificar variables
pm2 env ceres-worker | grep REDIS
```

### Jobs no se procesan

1. Verificar que el worker esté corriendo: `pm2 list`
2. Verificar conexión Redis: `redis-cli -n 5 PING`
3. Ver dashboard: http://127.0.0.1:3050/ui
4. Ver logs del worker: `pm2 logs ceres-worker`

### Dashboard no accesible

```bash
# Verificar proceso
pm2 list | grep queues-ui

# Verificar puerto
netstat -ano | findstr :3050

# Verificar logs
pm2 logs ceres-queues-ui
```

### Jobs en DLQ

1. Ir a Bull Board: http://127.0.0.1:3050/ui
2. Seleccionar cola con fallos
3. Ver detalles del job (error, stacktrace)
4. Corregir causa raíz
5. Retry manual desde UI o código:

```typescript
import { emailQueue } from '@/lib/queues';
const job = await emailQueue.getJob('email:verify:user-123');
await job?.retry();
```

## Próximos Pasos

1. **Files Queue**: Validación de CVs, optimización de imágenes
2. **Newsletter Queue**: Envío masivo de emails
3. **Métricas**: Prometheus/Grafana para monitoreo
4. **Rate Limiting**: Throttle en SMTP para evitar bans
5. **Multi-tenancy**: Soporte para múltiples municipalidades

## Referencias

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [ioredis](https://github.com/redis/ioredis)

