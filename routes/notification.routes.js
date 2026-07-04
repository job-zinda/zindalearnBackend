import express from 'express';
import { 
  getUserNotifications, 
  getUnreadCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

export default router;
