/**
 * Entry point del Worker de BullMQ
 * 
 * Este script:
 * - Inicializa workers para todas las colas (email, slack, maintenance)
 * - Configura listeners de eventos para DLQ/errores
 * - Programa crons de mantenimiento
 * 
 * Para ejecutar:
 * - Dev: npm run worker:dev
 * - Prod: npm run worker:start (después de npm run build)
 */

import { Worker, QueueEvents } from 'bullmq';
import { redisConnection } from '../src/lib/redis';
import { sendVerificationEmail, sendWelcomeEmail } from '../src/jobs/email.worker';
import { postToSlack } from '../src/jobs/slack.worker';
import { scheduleMaintenance, createMaintenanceWorker } from '../src/jobs/maintenance.worker';
import { optimizeProfileImage, validateCV } from '../src/jobs/files.worker';
import 'dotenv/config';

const base = redisConnection();

console.log('[worker] Inicializando workers...');
console.log('[worker] Redis:', process.env.REDIS_URL);
console.log('[worker] Prefix:', base.prefix);

// ========================================
// EMAIL WORKER
// ========================================
const emailWorker = new Worker('email', async (job) => {
  console.log(`[email.worker] Processing job ${job.id} (${job.name})`);
  
  if (job.name === 'verify') {
    await sendVerificationEmail(job.data);
  } else if (job.name === 'welcome') {
    await sendWelcomeEmail(job.data);
  } else {
    console.warn(`[email.worker] Unknown job type: ${job.name}`);
  }
}, { 
  ...base, 
  concurrency: 5, // Procesa hasta 5 emails simultáneos
});

emailWorker.on('completed', (job) => {
  console.log(`[email.worker] ✓ Job ${job.id} completado`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[email.worker] ✗ Job ${job?.id} falló:`, err.message);
});

// ========================================
// SLACK WORKER
// ========================================
const slackWorker = new Worker('slack', async (job) => {
  console.log(`[slack.worker] Processing job ${job.id} (${job.name})`);
  
  if (job.name === 'alert') {
    await postToSlack(job.data);
  } else {
    console.warn(`[slack.worker] Unknown job type: ${job.name}`);
  }
}, { 
  ...base, 
  concurrency: 10, // Alta concurrencia para alertas
});

slackWorker.on('completed', (job) => {
  console.log(`[slack.worker] ✓ Job ${job.id} completado`);
});

slackWorker.on('failed', (job, err) => {
  console.error(`[slack.worker] ✗ Job ${job?.id} falló:`, err.message);
  // No enviar a Slack para evitar loops
});

// ========================================
// FILES WORKER
// ========================================
const filesWorker = new Worker('files', async (job) => {
  console.log(`[files.worker] Processing job ${job.id} (${job.name})`);
  if (job.name === 'optimize-profile-image') {
    await optimizeProfileImage(job.data);
  } else if (job.name === 'validate-cv') {
    await validateCV(job.data);
  } else {
    console.warn(`[files.worker] Unknown job type: ${job.name}`);
  }
}, { ...base, concurrency: 2 });

filesWorker.on('completed', (job) => {
  console.log(`[files.worker] ✓ Job ${job.id} completado`);
});

filesWorker.on('failed', (job, err) => {
  console.error(`[files.worker] ✗ Job ${job?.id} falló:`, err.message);
});

// ========================================
// QUEUE EVENTS - DLQ (Dead Letter Queue)
// ========================================
const emailEvents = new QueueEvents('email', base);
emailEvents.on('failed', async ({ jobId, failedReason }) => {
  // Detectar si agotó todos los reintentos (DLQ)
  const isDLQ = failedReason && failedReason.includes('exceeded');
  
  if (isDLQ) {
    console.error(`[DLQ] Email job ${jobId} agotó reintentos: ${failedReason}`);
    await postToSlack({
      text: `🔥 DLQ Email: Job ${jobId} agotó reintentos\n${failedReason}`
    });
  }
});

const slackEvents = new QueueEvents('slack', base);
slackEvents.on('failed', async ({ jobId, failedReason }) => {
  console.error(`[DLQ] Slack job ${jobId} falló:`, failedReason);
  // No enviar a Slack para evitar loops
});

const filesEvents = new QueueEvents('files', base);
filesEvents.on('failed', async ({ jobId, failedReason }) => {
  console.error(`[DLQ] Files job ${jobId} falló:`, failedReason);
  await postToSlack({
    text: `🔥 DLQ Files: Job ${jobId} agotó reintentos\n${failedReason}`
  });
});

// ========================================
// MAINTENANCE WORKER
// ========================================
const maintenanceWorker = createMaintenanceWorker(base);

maintenanceWorker.on('completed', (job) => {
  console.log(`[maintenance.worker] ✓ Job ${job.id} completado`);
});

maintenanceWorker.on('failed', (job, err) => {
  console.error(`[maintenance.worker] ✗ Job ${job?.id} falló:`, err.message);
});

// ========================================
// CRONS DE MANTENIMIENTO
// ========================================
scheduleMaintenance(base)
  .then(() => console.log('[worker] ✓ Crons de mantenimiento programados'))
  .catch((err) => {
    console.error('[worker] Error programando crons:', err);
    process.exit(1);
  });

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
const shutdown = async (signal: string) => {
  console.log(`\n[worker] Recibido ${signal}, cerrando workers...`);
  
  await Promise.all([
    emailWorker.close(),
    slackWorker.close(),
    filesWorker.close(),
    maintenanceWorker.close(),
    emailEvents.close(),
    slackEvents.close(),
    filesEvents.close(),
  ]);
  
  console.log('[worker] Workers cerrados exitosamente');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log('[worker] ✓ Workers inicializados y escuchando jobs');

