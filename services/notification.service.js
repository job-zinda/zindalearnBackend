import Notification from '../models/Notification.js';

export const notificationService = {
  getUserNotifications: async (userId) => {
    return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  },

  getUnreadCount: async (userId) => {
    return await Notification.countDocuments({ userId, isRead: false });
  },

  markAsRead: async (id, userId) => {
    return await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  },

  markAllRead: async (userId) => {
    return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  },

  createNotification: async ({ userId, title, message, type = 'info', link = '', metadata = {} }) => {
    return await Notification.create({ userId, title, message, type, link, metadata });
  }
};
