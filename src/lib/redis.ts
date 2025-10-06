import type { RedisOptions } from 'ioredis';

/**
 * Configuración de conexión Redis para BullMQ
 * 
 * - Usa una DB lógica separada (por defecto 5) para aislar las colas del resto de Redis
 * - Prefix para namespacing: todas las keys tendrán el prefijo 'ceres:queue'
 * - maxRetriesPerRequest: null es requerido por BullMQ
 * 
 * Variables de entorno esperadas:
 * - REDIS_URL: redis://[user][:password@]host[:port][/db] (ej: redis://127.0.0.1:6379/5)
 * - REDIS_PREFIX: prefijo para las keys (opcional, default: 'ceres:queue')
 */
export function redisConnection() {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379/5';
  const prefix = process.env.REDIS_PREFIX || 'ceres:queue';
  
  const opts: RedisOptions = {
    maxRetriesPerRequest: null, // Requerido por BullMQ
    enableReadyCheck: true,
  };
  
  return { 
    connection: { ...opts, ...parseRedisUrl(url) }, 
    prefix 
  };
}

/**
 * Helper para parsear REDIS_URL y extraer host, port, db, password
 */
function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) : 0,
      password: parsed.password || undefined,
    };
  } catch {
    // Fallback: asumir formato simple host:port/db
    console.warn('REDIS_URL mal formada, usando defaults: 127.0.0.1:6379/5');
    return { host: '127.0.0.1', port: 6379, db: 5 };
  }
}

