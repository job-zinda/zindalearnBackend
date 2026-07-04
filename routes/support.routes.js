import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
  adminGetAllTickets,
  adminUpdateTicket
} from '../controllers/support.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User-facing ticket endpoints (accessible to students/instructors)
router.post('/tickets', createTicket);
router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:id/replies', replyToTicket);

// Admin-only support ticket endpoints
router.get('/admin/tickets', authorize('admin'), adminGetAllTickets);
router.patch('/admin/tickets/:id', authorize('admin'), adminUpdateTicket);
router.post('/admin/tickets/:id/replies', authorize('admin'), replyToTicket);

export default router;
