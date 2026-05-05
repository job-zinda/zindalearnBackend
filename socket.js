import { Server } from "socket.io";

let io;
const onlineUsers = new Map();

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("user_online", (userId) => {
      if (!userId) return;

      onlineUsers.set(String(userId), socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("join_room", (roomId) => {
      if (roomId) {
        socket.join(String(roomId));
      }
    });

    socket.on("leave_room", (roomId) => {
      if (roomId) {
        socket.leave(String(roomId));
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}