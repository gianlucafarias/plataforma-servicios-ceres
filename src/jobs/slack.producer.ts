import { slackQueue } from '@/lib/queues';

/**
 * Productores de jobs de Slack
 * 
 * Usado principalmente para:
 * - Alertas de errores críticos
 * - Notificaciones de DLQ (Dead Letter Queue)
 * - Alertas de mantenimiento
 */

/**
 * Encola una alerta a Slack
 * 
 * @param key - Identificador único de la alerta (para idempotencia)
 * @param text - Texto del mensaje
 * @returns Promise con el job creado
 */
export async function enqueueSlackAlert(key: string, text: string) {
  return slackQueue.add(
    'alert',
    { text },
    {
      jobId: `slack:${key}`, // Idempotente: mismo key no duplica alertas
      attempts: 3,
      backoff: { type: 'fixed', delay: 2000 }, // 2s entre reintentos
      removeOnComplete: true, // No necesitamos historial de alertas exitosas
    }
  );
}

