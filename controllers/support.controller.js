import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Private (Student/Instructor)
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, attachment, priority } = req.body;

    // Enforce that createdByRole is either student or instructor based on authenticated user
    if (!['student', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only students and instructors can create support tickets' });
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      createdByRole: req.user.role,
      subject,
      category,
      message,
      priority: priority || 'medium',
      attachment: attachment || ''
    });

    res.status(201).json({
      success: true,
      ticket,
      message: 'Support ticket submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all support tickets for the logged-in user
// @route   GET /api/support/tickets
// @access  Private (Student/Instructor)
export const getMyTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    const totalTickets = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      tickets,
      pagination: {
        totalTickets,
        totalPages: Math.ceil(totalTickets / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single support ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private (Owner/Admin)
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email role avatar profilePic')
      .populate('replies.user', 'name email role avatar profilePic');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role-based security access check: Only owner or admin can access the ticket
    if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this ticket' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a reply to a support ticket
// @route   POST /api/support/tickets/:id/replies
// @access  Private (Owner/Admin)
export const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role-based security access check: Only owner or admin can reply
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed support ticket' });
    }

    // Add reply
    ticket.replies.push({
      user: req.user.id,
      message,
      createdAt: new Date()
    });

    // Update ticket status dynamically
    if (req.user.role === 'admin') {
      ticket.status = 'pending'; // Admin replied, waiting for user
    } else {
      ticket.status = 'open'; // User replied, open for admin
    }

    await ticket.save();

    // Populate ticket to return updated information
    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email role avatar profilePic')
      .populate('replies.user', 'name email role avatar profilePic');

    // Trigger notification
    try {
      const { notificationService } = await import('../services/notification.service.js');
      const targetUserId = req.user.role === 'admin' ? ticket.user : null; // notify ticket creator if admin replied
      if (targetUserId) {
        const redirectLink = ticket.createdByRole === 'instructor' ? '/instructor/support' : '/help';
        await notificationService.createNotification({
          userId: targetUserId,
          title: "New Support Reply",
          message: `Admin has replied to your support ticket: "${ticket.subject}".`,
          type: "support_reply",
          link: redirectLink
        });
      }
    } catch (notifErr) {
      console.error("Support notification failed:", notifErr);
    }

    res.json({ success: true, ticket: updatedTicket, message: 'Reply added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all support tickets (Admin only)
// @route   GET /api/support/admin/tickets
// @access  Private (Admin only)
export const adminGetAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, priority, createdByRole, search } = req.query;
    const query = {};

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (createdByRole) query.createdByRole = createdByRole;

    if (search) {
      // Find users matching search first to match tickets by user
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const userIds = users.map(u => u._id);

      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const totalTickets = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email role avatar profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      tickets,
      pagination: {
        totalTickets,
        totalPages: Math.ceil(totalTickets / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update support ticket status or priority (Admin only)
// @route   PATCH /api/support/admin/tickets/:id
// @access  Private (Admin only)
export const adminUpdateTicket = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      }
    }

    if (priority) {
      ticket.priority = priority;
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email role avatar profilePic')
      .populate('replies.user', 'name email role avatar profilePic');

    // Trigger notification on resolution
    if (status === 'resolved' || status === 'closed') {
      try {
        const { notificationService } = await import('../services/notification.service.js');
        const redirectLink = ticket.createdByRole === 'instructor' ? '/instructor/support' : '/help';
        await notificationService.createNotification({
          userId: ticket.user,
          title: "Ticket Status Updated",
          message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
          type: "support_resolved",
          link: redirectLink
        });
      } catch (notifErr) {
        console.error("Support status notification failed:", notifErr);
      }
    }

    res.json({ success: true, ticket: updatedTicket, message: 'Ticket updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
