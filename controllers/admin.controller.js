import { adminService } from "../services/admin.service.js";
import mongoose from "mongoose";
import { dispatchNotification } from "../services/notificationDispatcher.js";
import SystemSettings from "../models/SystemSettings.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getPendingInstructors = async (req, res) => {
  try {
    const instructors = await adminService.getPendingInstructors();
    res.status(200).json({ success: true, data: instructors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveInstructor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const instructor = await adminService.approveInstructor(req.params.id);
    if (!instructor) return res.status(404).json({ success: false, message: "Instructor not found" });


    import('../services/notification.service.js').then(({ notificationService }) => {
      notificationService.createNotification({
        userId: req.params.id,
        title: "Account Approved",
        message: "Congratulations! Your instructor account has been approved. You can now create courses.",
        type: "success"
      }).catch(console.error);
    });

    res.status(200).json({ success: true, message: "Instructor approved", data: instructor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectInstructor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    await adminService.rejectInstructor(req.params.id);
    res.status(200).json({ success: true, message: "Instructor rejected/removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    const { students, total } = await adminService.getStudents(req.query);
    res.status(200).json({ success: true, total, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const stats = await adminService.getStudentStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTutors = async (req, res) => {
  try {
    const { tutors, total } = await adminService.getTutors(req.query);
    res.status(200).json({ success: true, total, data: tutors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { users, total } = await adminService.getAllUsers(req.query);
    res.status(200).json({ success: true, total, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, message: "User created", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, message: "User updated", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const adminId = req.user.id || req.user._id; // Get from JWT protect middleware
    await adminService.deleteUser(req.params.id, adminId);
    res.status(200).json({ success: true, message: "User soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    await adminService.restoreUser(req.params.id);
    res.status(200).json({ success: true, message: "User restored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const { blockedReason } = req.body;
    const adminId = req.user.id || req.user._id;
    const user = await adminService.blockUser(req.params.id, blockedReason, adminId);

    // Notify user of block
    try {
      const { notificationService } = await import('../services/notification.service.js');
      await notificationService.createNotification({
        userId: user._id,
        title: "Account Blocked",
        message: `Your account has been suspended. Reason: ${blockedReason || "Violation of platform policies"}.`,
        type: "account_blocked",
        link: "/account-blocked"
      });
    } catch (notifErr) {
      console.error("Account block DB notification failed:", notifErr);
    }

    res.status(200).json({ success: true, message: "User blocked successfully", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const user = await adminService.unblockUser(req.params.id);

    // Notify user of restore
    try {
      const { notificationService } = await import('../services/notification.service.js');
      await notificationService.createNotification({
        userId: user._id,
        title: "Account Restored",
        message: `Your account has been successfully unblocked. Welcome back!`,
        type: "account_restored",
        link: "/"
      });
    } catch (notifErr) {
      console.error("Account restore DB notification failed:", notifErr);
    }

    res.status(200).json({ success: true, message: "User unblocked successfully", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const blockCourse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const { blockedReason } = req.body;
    const adminId = req.user.id || req.user._id;
    const course = await adminService.blockCourse(req.params.id, blockedReason, adminId);
    res.status(200).json({ success: true, message: "Course blocked successfully", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unblockCourse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const course = await adminService.unblockCourse(req.params.id);
    res.status(200).json({ success: true, message: "Course restored/unblocked successfully", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { courses, total } = await adminService.getAllCourses(req.query);
    res.status(200).json({ success: true, total, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    await adminService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCourseStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const { status } = req.body;
    const adminId = req.user.id || req.user._id;
    const course = await adminService.updateCourseStatus(req.params.id, status, adminId);
    res.status(200).json({ success: true, message: `Course status updated to ${status}`, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCourses = async (req, res) => {
  try {
    const courses = await adminService.getPendingCourses();
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCourse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const adminId = req.user.id || req.user._id;
    const course = await adminService.approveCourse(req.params.id, adminId);

    // Notify instructor of approval
    if (course && course.instructor) {
      try {
        const { notificationService } = await import('../services/notification.service.js');
        await notificationService.createNotification({
          userId: course.instructor,
          title: "Course Approved",
          message: `Your course "${course.title}" has been approved and is now live.`,
          type: "course_approved",
          link: "/instructor/my-courses"
        });
      } catch (notifErr) {
        console.error("Course approval DB notification failed:", notifErr);
      }
    }

    res.status(200).json({ success: true, message: "Course approved", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const declineCourse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const { declineReason } = req.body;
    const adminId = req.user.id || req.user._id;
    const course = await adminService.declineCourse(req.params.id, declineReason, adminId);

    // Notify instructor of declination
    if (course && course.instructor) {
      try {
        const { notificationService } = await import('../services/notification.service.js');
        await notificationService.createNotification({
          userId: course.instructor,
          title: "Course Declined",
          message: `Your course "${course.title}" was declined. Reason: ${declineReason || 'Violation of guidelines'}.`,
          type: "course_declined",
          link: "/instructor/my-courses"
        });
      } catch (notifErr) {
        console.error("Course declination DB notification failed:", notifErr);
      }
    }

    res.status(200).json({ success: true, message: "Course declined", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { payments, total } = await adminService.getPayments(req.query);
    res.status(200).json({ success: true, total, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayouts = async (req, res) => {
  try {
    const { payouts, total } = await adminService.getPayouts(req.query);
    res.status(200).json({ success: true, total, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayoutStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const payout = await adminService.updatePayoutStatus(req.params.id, req.body);
    if (!payout) return res.status(404).json({ success: false, message: "Payout not found" });

    // Notify instructor of payout status update
    if (payout && payout.instructor) {
      const instId = payout.instructor._id || payout.instructor;
      try {
        if (req.body.status === 'paid' || req.body.status === 'approved') {
          await dispatchNotification({
            userId: instId,
            type: "payouts",
            title: "Payout Approved 💳",
            message: `Your payout request of ₹${payout.amount} has been approved.`,
            link: "/instructor/earnings"
          });
        } else if (req.body.status === 'rejected') {
          await dispatchNotification({
            userId: instId,
            type: "payouts",
            title: "Payout Rejected ❌",
            message: `Your payout request of ₹${payout.amount} was rejected. Comment: ${req.body.adminComment || 'None'}.`,
            link: "/instructor/earnings"
          });
        }
      } catch (notifErr) {
        console.error("Payout status update DB notification failed:", notifErr);
      }
    }

    res.status(200).json({ success: true, message: `Payout status updated to ${req.body.status}`, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get global system settings
// @route   GET /api/admin/settings
export const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const backendStatus = 'Healthy';

    res.status(200).json({
      success: true,
      data: {
        ...settings.toObject(),
        dbStatus,
        backendStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update global system settings
// @route   PUT /api/admin/settings
export const updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    const {
      maintenanceMode,
      allowStudentRegistration,
      allowInstructorApplications,
      enablePublicCourseBrowsing,
      requireEmailVerification,
      enableGoogleLogin,
      jwtSessionTimeout,
      enableEmailService,
      adminAlertEmails,
      platformVersion
    } = req.body;

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (allowStudentRegistration !== undefined) settings.allowStudentRegistration = allowStudentRegistration;
    if (allowInstructorApplications !== undefined) settings.allowInstructorApplications = allowInstructorApplications;
    if (enablePublicCourseBrowsing !== undefined) settings.enablePublicCourseBrowsing = enablePublicCourseBrowsing;
    if (requireEmailVerification !== undefined) settings.requireEmailVerification = requireEmailVerification;
    if (enableGoogleLogin !== undefined) settings.enableGoogleLogin = enableGoogleLogin;
    if (jwtSessionTimeout !== undefined) settings.jwtSessionTimeout = jwtSessionTimeout;
    if (enableEmailService !== undefined) settings.enableEmailService = enableEmailService;
    if (adminAlertEmails !== undefined) settings.adminAlertEmails = adminAlertEmails;
    if (platformVersion !== undefined) settings.platformVersion = platformVersion;

    await settings.save();

    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const backendStatus = 'Healthy';

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        ...settings.toObject(),
        dbStatus,
        backendStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

