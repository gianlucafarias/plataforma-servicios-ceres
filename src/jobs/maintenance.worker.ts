import { ConnectionOptions, Queue, Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { enqueueSlackAlert } from './slack.producer';

/**
 * Workers/Consumidores para jobs de mantenimiento
 * 
 * Incluye:
 * - Limpieza de tokens de verificación vencidos
 * - Reportes diarios
 * - Otros crons de mantenimiento
 */

interface RedisConfig {
  connection: ConnectionOptions;
  prefix: string;
}

/**
 * Configura los crons de mantenimiento como repeatable jobs
 * 
 * @param base - Configuración de conexión Redis
 */
export async function scheduleMaintenance(base: RedisConfig) {
  const q = new Queue('maintenance', base);

  // Limpieza de tokens de verificación vencidos cada hora
  await q.add('clean-verification-tokens', {}, {
    jobId: 'maintenance:clean-verification-tokens',
    repeat: { 
      pattern: '0 * * * *', // Cada hora
      tz: 'America/Argentina/Cordoba' 
    },
    removeOnComplete: true,
  });

  // Reporte diario a las 09:00
  await q.add('daily-report', {}, {
    jobId: 'maintenance:daily-report',
    repeat: { 
      pattern: '0 9 * * *', // 09:00 todos los días
      tz: 'America/Argentina/Cordoba' 
    },
    removeOnComplete: true,
  });

  console.log('[maintenance.worker] Crons de mantenimiento programados');
}


/**
 * Inicializa el worker de maintenance (llamar desde scripts/worker.ts)
 */
export function createMaintenanceWorker(base: RedisConfig) {
  return new Worker('maintenance', async (job) => {
    if (job.name === 'clean-verification-tokens') {
      await cleanExpiredVerificationTokens();
    } else if (job.name === 'daily-report') {
      await generateDailyReport();
    }
  }, { ...base, concurrency: 1 });
}


/**
 * Limpia tokens de verificación vencidos
 */
async function cleanExpiredVerificationTokens() {
  const result = await prisma.verificationToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  console.log(`[maintenance.worker] Limpiados ${result.count} tokens de verificación vencidos`);
  
  if (result.count > 100) {
    await enqueueSlackAlert(
      `maintenance:clean-tokens:${new Date().toISOString().split('T')[0]}`,
      `🧹 Limpiados ${result.count} tokens de verificación vencidos`
    );
  }
}

/**
 * Genera y envía reporte diario
 */
async function generateDailyReport() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, newUsersToday, totalProfessionals] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.professional.count(),
  ]);

  const report = `📊 Reporte Diario Ceres\n` +
    `Usuarios totales: ${totalUsers}\n` +
    `Nuevos hoy: ${newUsersToday}\n` +
    `Profesionales activos: ${totalProfessionals}`;

  await enqueueSlackAlert(
    `maintenance:daily-report:${today.toISOString().split('T')[0]}`,
    report
  );

  console.log('[maintenance.worker] Reporte diario generado');
}

