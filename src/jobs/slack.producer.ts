//import { slackQueue } from '@/lib/queues';

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
 * @returns Promise con el job creado o null si falla (no bloquea la operación principal)
 * 
 * NOTA: Desactivado temporalmente - no envía alertas
 */
export async function enqueueSlackAlert(_key: string, _text: string) {
  // Desactivado temporalmente - retornar sin hacer nada
  return null;
  
  // Código original comentado:
  // try {
  //   return await slackQueue.add(
  //     'alert',
  //     { text },
  //     {
  //       jobId: `slack:${key}`, // Idempotente: mismo key no duplica alertas
  //       attempts: 3,
  //       backoff: { type: 'fixed', delay: 2000 }, // 2s entre reintentos
  //       removeOnComplete: true, // No necesitamos historial de alertas exitosas
  //     }
  //   );
  // } catch (error) {
  //   // Si Redis no está disponible o hay algún error, no bloqueamos la operación principal
  //   // Las alertas de Slack son secundarias
  //   console.warn('No se pudo enviar alerta a Slack (Redis no disponible o error):', error instanceof Error ? error.message : error);
  //   return null;
  // }
}

