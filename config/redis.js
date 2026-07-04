import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    // Keep connection alive — prevents idle disconnects from Redis Cloud / Upstash
    keepAlive: 5000,
    // Reconnect with exponential backoff (capped at 30s) — survives Redis restarts on EC2
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('[Redis] Max reconnection attempts reached. Giving up.');
        return new Error('Redis max retries exceeded');
      }
      const delay = Math.min(retries * 500, 30000);
      console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})...`);
      return delay;
    }
  }
});

redisClient.on('error', (err) => {
  // Log but do NOT crash — Redis errors are recoverable (OTP/cache will fail gracefully)
  console.error('[Redis] Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Client connected successfully');
});

redisClient.on('reconnecting', () => {
  console.warn('[Redis] Client reconnecting...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Client ready');
});

// Connect on startup
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    // Non-fatal — OTP features won't work but app still starts
    console.error('[Redis] Failed to connect on startup:', err.message);
  }
})();

export default redisClient;
