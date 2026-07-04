import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { emitToConversation, emitToUser } from '../sockets/index.js';
import { dispatchNotification } from '../services/notificationDispatcher.js';

/**
 * Authorization helper to check if messaging is allowed between two users for a specific course
 */
const canMessage = async (senderId, receiverId, courseId) => {
  const sender = await User.findById(senderId);
  if (!sender) throw new Error('Sender not found');
  
  if (sender.role === 'admin') return true; 

  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');

  const sId = senderId.toString();
  const rId = receiverId.toString();
  const iId = course.instructor.toString();

  console.log(`[MSG_AUTH] Sender: ${sId}, Receiver: ${rId}, Course Instructor: ${iId}`);

  // Case 1: Student sending to Instructor
  if (sender.role === 'student') {
    // Student must be enrolled
    const enrollment = await Enrollment.findOne({ 
      user: senderId, 
      course: courseId,
      paymentStatus: { $in: ['completed', 'free'] }
    });
    if (!enrollment) throw new Error('You must be enrolled in this course to message the instructor');

    // Student can ONLY message the instructor of that course
    if (iId !== rId) {
      throw new Error('Invalid receiver: Students can only message the instructor of their enrolled course');
    }
    return true;
  }

  // Case 2: Instructor sending to Student
  if (sender.role === 'instructor') {
    // Instructor must own the course
    if (course.instructor.toString() !== senderId.toString()) {
      throw new Error('You are not the instructor of this course');
    }

    // Receiver must be an enrolled student
    const enrollment = await Enrollment.findOne({ 
      user: receiverId, 
      course: courseId,
      paymentStatus: { $in: ['completed', 'free'] }
    });
    if (!enrollment) throw new Error('Receiver is not enrolled in your course');
    
    return true;
  }

  throw new Error('Unauthorized messaging attempt');
};

// @desc    Send a direct message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, courseId, text, attachments, messageType, audioUrl, audioDuration } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const senderId = req.user._id;

    if (!receiverId || !courseId) {
      return res.status(400).json({ success: false, message: 'Receiver and Course are required' });
    }

    // Text is required ONLY for text messages
    if (messageType === 'text' && !text) {
       return res.status(400).json({ success: false, message: 'Text is required for text messages' });
    }

    console.log(`[MSG_DEBUG] Sending message from ${senderId} to ${receiverId} for course ${courseId}`);

    // 1. Enforce Role-Based Access Control
    await canMessage(senderId, receiverId, courseId);

    // 2. Find or Create Conversation
    // Using $all and courseId ensures we find the exact thread
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      course: courseId,
      type: 'direct'
    });

    if (!conversation) {
      console.log('[MSG_DEBUG] Creating new direct conversation');
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        course: courseId,
        type: 'direct'
      });
    }

    // 3. Create Message
    const msg = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      text,
      attachments,
      messageType: messageType || 'text',
      audioUrl,
      audioDuration,
      readBy: [senderId]
    });

    // 4. Update lastMessage in Conversation (for inbox sorting)
    conversation.lastMessage = {
      text: messageType === 'audio' ? '🎵 Voice Message' : (messageType === 'image' ? '🖼️ Image' : text),
      sender: senderId,
      createdAt: msg.createdAt
    };
    await conversation.save();

    // 5. Emit Real-time Socket Events
    const populatedMsg = {
      ...msg.toObject(),
      sender: { _id: senderId, name: req.user.name, avatar: req.user.avatar }
    };

    // Emit to conversation room (for everyone active in this chat)
    emitToConversation(conversation._id, 'newMessage', populatedMsg);

    // Emit to receiver's personal room (for global notifications)
    emitToUser(receiverId, 'newNotification', {
      type: 'message',
      conversationId: conversation._id,
      senderName: req.user.name,
      text: text ? text.substring(0, 50) : ''
    });

    // Create DB Notification for receiver
    try {
      const redirectLink = req.user.role === 'student' ? '/instructor/messages' : '/student/messages';
      await dispatchNotification({
        userId: receiverId,
        type: 'messages',
        title: 'New Message 💬',
        message: `You received a message from ${req.user.name}: "${text ? text.substring(0, 50) : 'Media Attachment'}"`,
        link: redirectLink,
        metadata: { conversationId: conversation._id }
      });
    } catch (notifErr) {
      console.error("Message DB notification failed:", notifErr);
    }

    return res.status(201).json({
      success: true,
      message: populatedMsg, // Return populated sender for consistency
      conversationId: conversation._id
    });

  } catch (error) {
    console.error('[MSG_CRITICAL] sendMessage Error:', error.message);
    // Use 400 for business logic/auth errors from canMessage, 500 for true system errors
    const statusCode = (error.message.includes('not found') || error.message.includes('enrolled') || error.message.includes('instructor')) ? 400 : 500;
    
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message || 'Error sending message' 
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
export const getConversations = async (req, res) => {
  try {
    // 1. Defensive Check: Ensure req.user is available
    if (!req.user || !req.user._id) {
      console.warn('[MSG_DEBUG] Unauthorized attempt to fetch conversations');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id;
    console.log(`[MSG_DEBUG] Fetching conversations for UserID: ${userId}`);

    // 2. Safe Mongo Query: Use $in for participants array
    // 3. Safe Populate: Avoid crashing if referenced docs are missing
    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    })
    .populate({
      path: 'participants',
      select: 'name avatar role email'
    })
    .populate({
      path: 'course',
      select: 'title thumbnail instructor'
    })
    .sort({ updatedAt: -1 })
    .lean(); // Convert to plain JS objects for better performance

    // 4. Debug Logs
    console.log(`[MSG_DEBUG] Found ${conversations.length} conversations`);

    // 5. Handle Missing Data Gracefully (returns empty array if none found)
    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations: conversations || []
    });

  } catch (error) {
    // 6. meaningful error logs
    console.error('[MSG_CRITICAL] getConversations Error:', {
      message: error.message,
      stack: error.stack,
      user: req.user?._id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while retrieving conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user._id;

    // Ensure user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] }
    });

    if (!conversation) {
      console.warn(`[MSG_DEBUG] Unauthorized message fetch by ${userId} for room ${conversationId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You are not a participant in this conversation' 
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate({
        path: 'sender',
        select: 'name avatar role'
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({ 
      success: true, 
      count: messages.length,
      messages 
    });

  } catch (error) {
    console.error('[MSG_CRITICAL] getMessages Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching messages', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:conversationId/read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    // Emit socket event to notify other participants
    emitToConversation(conversationId, 'messageSeen', {
      conversationId,
      userId,
      timestamp: new Date()
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Broadcast message to all students in a course
// @route   POST /api/messages/broadcast
export const broadcastMessage = async (req, res) => {
  try {
    const { courseId, text, attachments, messageType, audioUrl, audioDuration } = req.body;
    const senderId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Ensure sender is the instructor
    if (course.instructor.toString() !== senderId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only course instructor can broadcast' });
    }

    // Get all enrolled students
    const enrollments = await Enrollment.find({ 
      course: courseId, 
      paymentStatus: { $in: ['completed', 'free'] } 
    }).select('user');

    const studentIds = enrollments.map(e => e.user);

    // Note: In a real system, we might create a single 'broadcast' conversation record 
    // OR create individual conversations. The prompt suggests "Create/update conversations for each student"
    // to handle it in their inbox.

    const broadcastPromises = studentIds.map(async (studentId) => {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, studentId] },
        course: courseId
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, studentId],
          course: courseId,
          type: 'direct' // We keep it direct so they can reply
        });
      }

      const msg = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        text: messageType === 'audio' ? `[BROADCAST] Voice Message` : `[BROADCAST] ${text}`,
        attachments,
        messageType: messageType || 'text',
        audioUrl,
        audioDuration,
        readBy: [senderId]
      });

      conversation.lastMessage = {
        text: messageType === 'audio' ? `🎵 [BROADCAST] Voice Message` : `[BROADCAST] ${text}`,
        sender: senderId,
        createdAt: msg.createdAt
      };
      await conversation.save();

      // Emit Real-time Socket Event to student
      emitToUser(studentId, 'newNotification', {
        type: 'broadcast',
        conversationId: conversation._id,
        senderName: req.user.name,
        text: `[Broadcast] ${text.substring(0, 50)}`
      });
      
      // Emit to conversation room if they are looking at it
      emitToConversation(conversation._id, 'newMessage', {
        ...msg.toObject(),
        sender: { _id: senderId, name: req.user.name, avatar: req.user.avatar }
      });

      // Create DB Notification for student
      try {
        await dispatchNotification({
          userId: studentId,
          type: 'messages',
          title: 'New Announcement 📢',
          message: `Broadcast from ${req.user.name} in "${course.title}": "${text ? text.substring(0, 50) : ''}"`,
          link: "/student/messages",
          metadata: { conversationId: conversation._id }
        });
      } catch (notifErr) {
        console.error("Broadcast DB notification failed:", notifErr);
      }
    });

    await Promise.all(broadcastPromises);

    res.status(200).json({ 
      success: true, 
      message: `Broadcast sent to ${studentIds.length} students` 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get eligible contacts to start a new chat
// @route   GET /api/messages/eligible-contacts
export const getEligibleContacts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'student') {
      // Get all enrolled courses where payment is confirmed
      const enrollments = await Enrollment.find({ 
        user: userId, 
        paymentStatus: { $in: ['completed', 'free'] } 
      }).populate({
        path: 'course',
        select: 'title instructor',
        populate: { path: 'instructor', select: 'name avatar' }
      });

      const contacts = enrollments
        .filter(e => e.course && e.course.instructor)
        .map(e => ({
          user: e.course.instructor,
          course: { _id: e.course._id, title: e.course.title }
        }));

      // Unique by user + course
      const seen = new Set();
      const uniqueContacts = contacts.filter(c => {
        const key = `${c.user._id}-${c.course._id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return res.status(200).json({ success: true, contacts: uniqueContacts });
    }

    if (role === 'instructor') {
      // Get all courses owned by instructor
      const courses = await Course.find({ instructor: userId }).select('_id title');
      const courseIds = courses.map(c => c._id);

      // Get all students enrolled in these courses
      const enrollments = await Enrollment.find({ 
        course: { $in: courseIds },
        paymentStatus: { $in: ['completed', 'free'] }
      }).populate({
        path: 'user',
        select: 'name avatar'
      }).populate({
        path: 'course',
        select: 'title'
      });

      const contacts = enrollments
        .filter(e => e.user && e.course)
        .map(e => ({
          user: e.user,
          course: { _id: e.course._id, title: e.course.title }
        }));

      return res.status(200).json({ success: true, contacts });
    }

    return res.status(200).json({ success: true, contacts: [] });
  } catch (error) {
    console.error('[MSG_CRITICAL] getEligibleContacts Error:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching eligible contacts' });
  }
};
