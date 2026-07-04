import { createServer } from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/index.js';
import { startLiveClassScheduler } from './services/liveClassScheduler.js';

// ─── Global error handlers — prevent PM2/Node process from dying on unhandled errors ──
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
});

// Connect to database
connectDB();

const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ─── Server Start 
const PORT = process.env.PORT || 5005;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  startLiveClassScheduler();
});
