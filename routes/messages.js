import express from 'express';
const router = express.Router();
import {
  sendMessage,
  getConversations,
  getMessages,
  broadcastMessage,
  getEligibleContacts,
  markAsRead
} from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/auth.js';

// All routes require login
router.use(protect);

// Get my list of conversations
router.get('/conversations', getConversations);

// Get eligible contacts to chat with
router.get('/eligible-contacts', getEligibleContacts);

// Get messages in a specific conversation
router.get('/:conversationId', getMessages);

// Mark messages as read
router.put('/:conversationId/read', markAsRead);

// Send a direct message
router.post('/', sendMessage);

// Broadcast (Instructor only)
router.post('/broadcast', authorize('instructor', 'admin'), broadcastMessage);

export default router;
