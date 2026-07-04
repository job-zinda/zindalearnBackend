import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { dispatchNotification } from "../services/notificationDispatcher.js";

// @desc    Grant manual enrollment (admin gives course access to a student)
// @route   POST /api/admin/enrollments/grant
// @access  Admin only
export const grantEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required"
      });
    }

    // Validate student exists and is a student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: "User is not a student"
      });
    }

    // Validate course exists
    const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: studentId,
      course: courseId
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled in this course"
      });
    }

    // Create manual enrollment
    const enrollment = await Enrollment.create({
      user: studentId,
      course: courseId,
      paymentStatus: 'completed',
      amountPaid: 0,
      accessType: 'manual',
      grantedBy: req.user.id,
      grantedAt: new Date()
    });

    // Update course and user
    await Promise.all([
      Course.findByIdAndUpdate(courseId, {
        $inc: { totalStudents: 1 },
        $addToSet: { students: studentId }
      }),
      User.findByIdAndUpdate(studentId, {
        $addToSet: { enrolledCourses: courseId }
      })
    ]);

    // Send notifications
    try {
      await dispatchNotification({
        userId: studentId,
        type: "courseEnrollments",
        title: "Course Access Granted 🎓",
        message: `You have been granted access to "${course.title}" by an administrator.`,
        link: "/student/my-learning"
      });

      if (course.instructor) {
        await dispatchNotification({
          userId: course.instructor,
          type: "courseEnrollments",
          title: "New Student Enrolled! 🎓",
          message: `${student.name || 'A student'} has been enrolled in your course "${course.title}" by admin.`,
          link: "/instructor/students"
        });
      }
    } catch (notifErr) {
      console.error("Manual enrollment notification failed:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Course access granted successfully",
      enrollment
    });
  } catch (error) {
    console.error("Grant enrollment error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Revoke enrollment (admin removes course access)
// @route   DELETE /api/admin/enrollments/:enrollmentId
// @access  Admin only
export const revokeEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    const userId = enrollment.user;
    const courseId = enrollment.course;

    // Delete the enrollment
    await Enrollment.findByIdAndDelete(enrollmentId);

    // Update course and user
    await Promise.all([
      Course.findByIdAndUpdate(courseId, {
        $inc: { totalStudents: -1 },
        $pull: { students: userId }
      }),
      User.findByIdAndUpdate(userId, {
        $pull: { enrolledCourses: courseId }
      })
    ]);

    // Notify student
    try {
      const course = await Course.findById(courseId);
      if (course) {
        await dispatchNotification({
          userId: userId,
          type: "courseEnrollments",
          title: "Course Access Revoked",
          message: `Your access to "${course.title}" has been revoked by an administrator.`,
          link: "/student/my-learning"
        });
      }
    } catch (notifErr) {
      console.error("Revoke enrollment notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Enrollment removed successfully"
    });
  } catch (error) {
    console.error("Revoke enrollment error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get enrollment history (all enrollments with populated data)
// @route   GET /api/admin/enrollments
// @access  Admin only
export const getEnrollmentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', accessType = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build match conditions for the pipeline
    const matchConditions = {};

    if (accessType && ['purchase', 'manual'].includes(accessType)) {
      matchConditions.accessType = accessType;
    }

    // Base query
    let query = Enrollment.find(matchConditions)
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail')
      .populate('grantedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get total before pagination
    const total = await Enrollment.countDocuments(matchConditions);

    // Apply pagination
    const enrollments = await query.skip(skip).limit(Number(limit));

    // Filter by search term on populated fields (student name/email or course title)
    let filteredEnrollments = enrollments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnrollments = enrollments.filter(e => {
        const studentName = e.user?.name?.toLowerCase() || '';
        const studentEmail = e.user?.email?.toLowerCase() || '';
        const courseTitle = e.course?.title?.toLowerCase() || '';
        return studentName.includes(searchLower) ||
               studentEmail.includes(searchLower) ||
               courseTitle.includes(searchLower);
      });
    }

    res.status(200).json({
      success: true,
      total: search ? filteredEnrollments.length : total,
      data: filteredEnrollments
    });
  } catch (error) {
    console.error("Get enrollment history error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
