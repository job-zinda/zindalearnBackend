import mongoose from 'mongoose';
import LiveClass from '../models/LiveClass.js';
import LiveAttendance from '../models/LiveAttendance.js';
import Course from '../../../models/Course.js';
import Enrollment from '../../../models/Enrollment.js';
import { getIO } from '../../../sockets/index.js';

// Helper to normalize live class status on raw objects (useful for lean queries)
const normalizeLiveClassObj = (lc) => {
  if (!lc) return lc;
  const now = new Date();
  
  let start = new Date(lc.startTime);
  if (isNaN(start.getTime())) {
    // If startTime is a legacy HH:mm string
    const datePart = lc.scheduledDate ? new Date(lc.scheduledDate).toISOString().split('T')[0] : now.toISOString().split('T')[0];
    const timePart = typeof lc.startTime === 'string' && lc.startTime.includes(':') ? lc.startTime : '00:00';
    start = new Date(`${datePart}T${timePart}:00`);
  }
  
  let end = new Date(lc.endTime);
  if (isNaN(end.getTime())) {
    // Fallback to start + duration
    const dur = Number(lc.duration) || 60;
    end = new Date(start.getTime() + dur * 60 * 1000);
  }

  if (lc.status !== 'cancelled') {
    if (now >= start && now <= end) {
      lc.status = 'live';
    } else if (now < start) {
      lc.status = 'upcoming';
    } else {
      lc.status = 'ended';
    }
  }

  // Update properties on the object
  lc.startTime = start;
  lc.endTime = end;

  // Add formatted virtual properties for forms
  lc.scheduledDateStr = start.toISOString().split('T')[0];
  const hours = String(start.getHours()).padStart(2, '0');
  const minutes = String(start.getMinutes()).padStart(2, '0');
  lc.startTimeStr = `${hours}:${minutes}`;
  return lc;
};

// @desc    Create a new live class
// @route   POST /api/live-classes
// @access  Instructor
export const createLiveClass = async (req, res) => {
  try {
    const { title, description, courseId, meetingLink, scheduledDate, startTime, duration, thumbnail, lessonId } = req.body;

    // Validate course ownership
    const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
    if (!course) {
      return res.status(403).json({ success: false, message: 'You are not authorized to create a live class for this course' });
    }

    // Parse start & end times as Date objects
    const start = new Date(`${scheduledDate}T${startTime}:00`);
    const end = new Date(start.getTime() + Number(duration) * 60 * 1000);

    // Initialize enrolled students from course enrollments
    const enrollments = await Enrollment.find({ course: courseId }).select('user');
    const studentIds = enrollments.map(e => e.user);

    const liveClass = await LiveClass.create({
      title,
      description,
      course: courseId,
      instructor: req.user._id,
      lesson: lessonId || undefined,
      meetingLink,
      startTime: start,
      endTime: end,
      duration: Number(duration),
      enrolledStudents: studentIds,
      thumbnail,
      status: 'upcoming'
    });

    // Notify students via Socket.IO
    const io = getIO();
    io.emit('liveClassScheduled', {
      liveClassId: liveClass._id,
      courseId: liveClass.course,
      title: liveClass.title
    });

    // Notify students via DB Notifications
    try {
      if (studentIds.length > 0) {
        const { notificationService } = await import('../../../services/notification.service.js');
        const notifPromises = studentIds.map(studentId => 
          notificationService.createNotification({
            userId: studentId,
            title: "New Live Class Scheduled",
            message: `A new live class "${title}" has been scheduled for course "${course.title}".`,
            type: "live_class",
            link: "/student/live-classes"
          })
        );
        await Promise.all(notifPromises);
      }
    } catch (notifErr) {
      console.error("Live class scheduled DB notification failed:", notifErr);
    }

    res.status(201).json({ success: true, data: liveClass });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a live class
// @route   PUT /api/live-classes/:id
// @access  Instructor
export const updateLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found or unauthorized' });
    }

    const currentStatus = normalizeLiveClassObj(liveClass.toObject()).status;
    if (currentStatus === 'ended' || currentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update an ended or cancelled class' });
    }

    // Support updating startTime / endTime from form scheduledDate & startTime parameters
    const updateData = { ...req.body };
    const scheduledDate = updateData.scheduledDate || new Date(liveClass.startTime).toISOString().split('T')[0];
    const startTimeStr = updateData.startTime || liveClass.startTimeStr;
    const duration = updateData.duration !== undefined ? Number(updateData.duration) : liveClass.duration;

    if (updateData.scheduledDate || updateData.startTime || updateData.duration !== undefined) {
      const start = new Date(`${scheduledDate}T${startTimeStr}:00`);
      updateData.startTime = start;
      updateData.endTime = new Date(start.getTime() + duration * 60 * 1000);
      updateData.duration = duration;
    }

    const updatedClass = await LiveClass.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a live class
// @route   DELETE /api/live-classes/:id
// @access  Instructor
export const deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found or unauthorized' });
    }

    liveClass.isDeleted = true;
    await liveClass.save();

    res.status(200).json({ success: true, message: 'Live class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start a live class
// @route   PATCH /api/live-classes/:id/start
// @access  Instructor
export const startLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found or unauthorized' });
    }

    // Force startTime to now
    const now = new Date();
    liveClass.startTime = now;
    liveClass.endTime = new Date(now.getTime() + liveClass.duration * 60 * 1000);
    liveClass.status = 'live';
    await liveClass.save();

    // Notify students via Socket.IO
    const io = getIO();
    io.emit('liveClassStarted', {
      liveClassId: liveClass._id,
      courseId: liveClass.course,
      title: liveClass.title
    });

    res.status(200).json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End a live class
// @route   PATCH /api/live-classes/:id/end
// @access  Instructor
export const endLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found or unauthorized' });
    }

    // Force endTime to now
    liveClass.endTime = new Date();
    liveClass.status = 'ended';
    await liveClass.save();

    // Notify students via Socket.IO
    const io = getIO();
    io.emit('liveClassEnded', {
      liveClassId: liveClass._id,
      courseId: liveClass.course,
      title: liveClass.title
    });

    res.status(200).json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get instructor live classes
// @route   GET /api/live-classes/instructor/all
// @access  Instructor
export const getInstructorLiveClasses = async (req, res) => {
  console.log('[LIVE_CLASS_DEBUG] Fetching classes for instructor...');
  try {
    const instructorId = req.user?._id || req.user?.id;

    if (!instructorId) {
      console.error('[LIVE_CLASS_ERROR] No instructor ID found in request');
      return res.status(401).json({ success: false, message: 'Unauthorized: No ID found' });
    }

    const liveClasses = await LiveClass.find({
      instructor: instructorId,
      isDeleted: { $ne: true }
    })
      .populate('course', 'title thumbnail')
      .sort({ startTime: -1 })
      .lean();

    const normalized = liveClasses.map(normalizeLiveClassObj);

    console.log(`[LIVE_CLASS_DEBUG] Successfully found ${normalized.length} classes for ${instructorId}`);

    return res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized
    });

  } catch (error) {
    console.error('[LIVE_CLASS_ERROR] Critical failure in getInstructorLiveClasses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get student live classes (from enrolled courses)
// @route   GET /api/live-classes/student
// @access  Student
export const getStudentLiveClasses = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication data missing' });
    }

    console.log(`[LIVE_CLASS_DEBUG] Fetching live classes for student: ${studentId}`);

    // 1. Get all courses the student is enrolled in
    const enrollments = await Enrollment.find({ user: studentId });
    const enrolledCourseIds = enrollments.map(e => e.course);

    console.log(`[LIVE_CLASS_DEBUG] Student ${studentId} enrollments:`, enrolledCourseIds.length);

    // 2. Get live classes for these courses
    const liveClasses = await LiveClass.find({
      course: { $in: enrolledCourseIds },
      isDeleted: { $ne: true },
      status: { $ne: 'cancelled' }
    })
      .populate('instructor', 'name avatar')
      .populate('course', 'title thumbnail')
      .sort({ startTime: 1 })
      .lean();

    const normalized = liveClasses.map(normalizeLiveClassObj);

    console.log(`[LIVE_CLASS_DEBUG] Found ${normalized.length} live classes for student ${studentId}`);

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized
    });
  } catch (error) {
    console.error('[LIVE_CLASS_ERROR] Error in getStudentLiveClasses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching student live classes',
      error: error.message
    });
  }
};

// @desc    Get single live class details
// @route   GET /api/live-classes/:id
// @access  Private
export const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[LIVE_CLASS_WARN] Invalid live class ID: ${id}`);
      return res.status(400).json({ success: false, message: 'Invalid live class ID format' });
    }

    const liveClass = await LiveClass.findById(id)
      .populate('instructor', 'name avatar bio')
      .populate('course', 'title thumbnail');

    if (!liveClass || liveClass.isDeleted) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    const userId = req.user?._id || req.user?.id;

    // Security: Check if student is enrolled if they are not the instructor
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ user: userId, course: liveClass.course });
      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
      }
    } else if (req.user.role === 'instructor' && liveClass.instructor?._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const dataObj = normalizeLiveClassObj(liveClass.toObject());

    res.status(200).json({ success: true, data: dataObj });
  } catch (error) {
    console.error('[LIVE_CLASS_ERROR] Error in getLiveClassById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching live class details',
      error: error.message
    });
  }
};

// @desc    Join live class (Attendance)
// @route   POST /api/live-classes/:id/join
// @access  Student
export const joinLiveClass = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass || liveClass.isDeleted) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    // Enrollment check
    const enrollment = await Enrollment.findOne({ user: studentId, course: liveClass.course });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    }

    const now = new Date();
    const start = new Date(liveClass.startTime);
    const diffInMinutes = (start - now) / (1000 * 60);

    const resolvedStatus = normalizeLiveClassObj(liveClass.toObject()).status;

    if (resolvedStatus !== 'live' && diffInMinutes > 10) {
      return res.status(400).json({
        success: false,
        message: 'You can only join when the class is LIVE or 10 minutes before it starts'
      });
    }

    // Add student to enrolledStudents array if not already present
    if (!liveClass.enrolledStudents.includes(studentId)) {
      liveClass.enrolledStudents.push(studentId);
      await liveClass.save();
    }

    // Track attendance
    let attendance = await LiveAttendance.findOne({ student: studentId, liveClass: liveClass._id });
    if (!attendance) {
      attendance = await LiveAttendance.create({
        student: studentId,
        liveClass: liveClass._id,
        joinedAt: now
      });
    }

    res.status(200).json({
      success: true,
      data: {
        meetingLink: liveClass.meetingLink,
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
