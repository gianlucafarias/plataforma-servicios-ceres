/**
 * Dashboard de colas deshabilitado temporalmente
 *
 * Antes:
 * - Levantaba un servidor Express con Bull Board para monitorear BullMQ
 * - Mantenía un proceso vivo consumiendo memoria
 *
 * Ahora lo dejamos como stub ligero que no levanta servidor ni colas,
 * solo informa que la UI de colas está desactivada.
 *
 * Comandos relacionados (package.json):
 * - npm run queues:ui:dev
 * - npm run queues:ui:start
 */

import 'dotenv/config';

console.log('========================================');
console.log('[queues-ui] Dashboard de colas DESHABILITADO');
console.log('[queues-ui] No se levanta Express ni Bull Board.');
console.log('[queues-ui] Podés eliminar o detener cualquier proceso pm2 que use este script.');
console.log('========================================');

process.exit(0);

