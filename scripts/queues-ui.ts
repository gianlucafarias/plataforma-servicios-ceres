/**
 * Dashboard Bull Board para monitoreo de colas
 * 
 * Este script:
 * - Levanta un servidor Express en puerto 3050
 * - Protege con Basic Auth (usuario: admin)
 * - Expone UI web para monitorear colas de BullMQ
 * 
 * Para ejecutar:
 * - Dev: npm run queues:ui:dev
 * - Prod: npm run queues:ui:start (después de npm run build)
 * 
 * Acceso:
 * - URL: http://127.0.0.1:3050/ui
 * - Usuario: admin
 * - Contraseña: variable QUEUES_UI_PASS (default: 'ceres')
 * 
 * IMPORTANTE: En producción, proteger con Nginx y/o restricción de IPs
 */

import express from 'express';
import basicAuth from 'express-basic-auth';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, slackQueue, maintenanceQueue, filesQueue } from '../src/lib/queues';

const app = express();
const PORT = process.env.QUEUES_UI_PORT || 3050;

// ========================================
// BASIC AUTH
// ========================================
const password = process.env.QUEUES_UI_PASS || 'ceres';
app.use(basicAuth({ 
  users: { admin: password }, 
  challenge: true,
  realm: 'Ceres Queues Dashboard'
}));

console.log('[queues-ui] Basic Auth configurado (usuario: admin)');

// ========================================
// BULL BOARD
// ========================================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/ui');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(slackQueue),
    new BullMQAdapter(maintenanceQueue),
    new BullMQAdapter(filesQueue),
  ],
  serverAdapter
});

app.use('/ui', serverAdapter.getRouter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Redirect root to /ui
app.get('/', (req, res) => {
  res.redirect('/ui');
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  🎛️  Ceres Queues Dashboard');
  console.log('========================================');
  console.log(`  URL: http://127.0.0.1:${PORT}/ui`);
  console.log(`  Usuario: admin`);
  console.log(`  Contraseña: ${password === 'ceres' ? 'ceres (default)' : '***'}`);
  console.log('========================================');
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
const shutdown = async (signal: string) => {
  console.log(`\n[queues-ui] Recibido ${signal}, cerrando servidor...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

