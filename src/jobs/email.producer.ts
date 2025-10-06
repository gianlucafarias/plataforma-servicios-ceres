import { emailQueue } from '@/lib/queues';

/**
 * Productores de jobs de email
 * 
 * Garantías:
 * - Al menos una vez: BullMQ garantiza que el job se ejecutará
 * - Idempotencia: mismo userId → mismo jobId, evita duplicados en cola
 * - Retries: 5 intentos con backoff exponencial (1s, 5s, 15s, 60s, 300s)
 */

interface EnqueueEmailVerifyParams {
  userId: string;
  token: string;
  email: string;
  firstName?: string;
}

/**
 * Encola el envío de email de verificación
 * 
 * @param params - userId, token, email, firstName
 * @returns Promise con el job creado
 */
export async function enqueueEmailVerify(params: EnqueueEmailVerifyParams) {
  const { userId, token, email, firstName } = params;
  
  return emailQueue.add(
    'verify', 
    { userId, token, email, firstName }, 
    {
      jobId: `email:verify:${userId}`, // Idempotente: mismo userId no duplica job
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 }, // 1s, 5s, 15s, 60s, 300s
      removeOnComplete: { age: 3600, count: 1000 }, // Limpia después de 1h
      removeOnFail: { age: 86400, count: 1000 }, // Mantiene fallos 24h para debug
    }
  );
}

/**
 * Encola el envío de email de bienvenida
 * 
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @param firstName - Nombre del usuario
 * @returns Promise con el job creado
 */
export async function enqueueEmailWelcome(userId: string, email: string, firstName?: string) {
  return emailQueue.add(
    'welcome',
    { userId, email, firstName },
    {
      jobId: `email:welcome:${userId}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 1000 },
    }
  );
}

