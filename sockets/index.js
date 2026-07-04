import { Server } from 'socket.io';
import { socketAuth } from './socketMiddleware.js';
import { callHandlers } from './callHandlers.js';

let io;
export const onlineUsers = new Map();


export const initSocket = (server) => {
  // Build allowed origins — must match the HTTP API CORS config exactly
  const originSet = new Set();
  [process.env.SOCKET_CORS_ORIGIN, process.env.FRONTEND_URL, process.env.APP_URL]
    .filter(Boolean)
    .forEach((url) => {
      originSet.add(url);
      // Auto-add www <-> non-www variant
      try {
        const parsed = new URL(url);
        if (parsed.hostname.startsWith('www.')) {
          parsed.hostname = parsed.hostname.slice(4);
        } else {
          parsed.hostname = 'www.' + parsed.hostname;
        }
        originSet.add(parsed.origin);
      } catch (_) {}
    });

  if (process.env.NODE_ENV === 'development') {
    ['http://localhost:5173', 'http://localhost:5174'].forEach(o => originSet.add(o));
  }

  const allowedOrigins = [...originSet];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Required for AWS ALB / Nginx reverse proxy — allows polling fallback
    // when WebSocket upgrade fails (e.g., sticky sessions not configured)
    transports: ['polling', 'websocket'],
    // Keeps connections alive through AWS ALB and proxies
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Use auth middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`⚡ Socket Connected: ${userId} (${socket.user.role})`);

    // Register user in onlineUsers map
    onlineUsers.set(userId, socket.id);

    // 1. Join personal room (for direct notifications)
    socket.join(userId);

    // 2. Handle joining a specific conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`👤 User ${userId} joined room: ${conversationId}`);
    });

    // 3. Handle leaving a conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`👤 User ${userId} left room: ${conversationId}`);
    });

    // 4. Typing indicators
    socket.on('typing', ({ conversationId, userName }) => {
      socket.to(conversationId).emit('userTyping', { userId, userName, conversationId });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(conversationId).emit('userStoppedTyping', { userId, conversationId });
    });

    // 5. Message Seen Status
    socket.on('markAsSeen', ({ conversationId, messageIds }) => {
      socket.to(conversationId).emit('messageSeen', { conversationId, userId, messageIds });
    });

    // 6. Voice Call Handlers
    callHandlers(io, socket, onlineUsers);

    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }
      console.log(`🔥 Socket Disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to emit events from controllers
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(conversationId.toString()).emit(event, data);
  }
};
