/**
 * Worker deshabilitado temporalmente
 *
 * Dejamos este archivo como stub ligero para que:
 * - No inicialice BullMQ ni Redis
 * - No consuma RAM en producción si alguien ejecuta el script
 * - Sea fácil de reactivar en el futuro si volvemos a usar colas
 *
 * Comandos que usan este entrypoint (package.json):
 * - npm run worker:dev
 * - npm run worker:start
 */

import 'dotenv/config';

console.log('========================================');
console.log('[worker] Workers de BullMQ DESHABILITADOS');
console.log('[worker] No se inicializan colas ni crons.');
console.log('[worker] Podés eliminar o detener cualquier proceso pm2 que use este script.');
console.log('========================================');

// Salir explícitamente para que no quede ningún event loop activo
process.exit(0);
