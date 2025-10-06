import { Queue } from 'bullmq';
import { redisConnection } from './redis';

/**
 * Colas de BullMQ para procesamiento asíncrono
 * 
 * Todas las colas comparten la misma configuración de Redis
 * y están aisladas en una DB lógica separada con prefix 'ceres:queue'
 */

const base = redisConnection();

/**
 * Cola de emails: verificación, welcome, newsletter
 * Jobs: 'verify', 'welcome', 'newsletter'
 */
export const emailQueue = new Queue('email', base);

/**
 * Cola de Slack: alertas, DLQ notifications
 * Jobs: 'alert'
 */
export const slackQueue = new Queue('slack', base);

/**
 * Cola de mantenimiento: crons, limpieza de tokens, reportes
 * Jobs: 'clean-verification-tokens', 'daily-report'
 */
export const maintenanceQueue = new Queue('maintenance', base);

/**
 * Cola de archivos: validación/normalización de CV y perfiles
 * Jobs: 'validate-cv', 'optimize-profile-picture'
 */
export const filesQueue = new Queue('files', base);

