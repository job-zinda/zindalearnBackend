import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";
import { dispatchNotification } from "../services/notificationDispatcher.js";

// Get user enrollments
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name avatar bio"
        }
      })
      .sort({ createdAt: -1 });

    // Filter out enrollments where the course no longer exists
    const validEnrollments = enrollments.filter(e => e.course !== null);

    // Convert to object to include virtuals on the course
    const enrollmentsWithVirtuals = validEnrollments.map(e => {
      const obj = e.toObject();
      if (obj.course) {
        // We need to manually ensure virtuals if the standard toObject doesn't catch them deep
        const course = e.course;
        obj.course = course.toObject({ virtuals: true });
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      enrollments: enrollmentsWithVirtuals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update progress
export const updateProgress = async (req, res) => {
  try {
    const { lessonId, moduleIndex, lessonIndex, lastVideoTimestamp, markCompleted } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    if (enrollment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // 1. Process timestamps if provided
    if (lastVideoTimestamp !== undefined && lastVideoTimestamp !== null) {
      enrollment.lastVideoTimestamp = Number(lastVideoTimestamp);
      enrollment.lastWatchedAt = new Date();
    }

    // 2. Determine if we should complete this lesson
    const isAutoSavePing = lastVideoTimestamp !== undefined;
    const shouldMarkComplete = (markCompleted === true) || (lessonId && !isAutoSavePing);

    if (shouldMarkComplete && lessonId && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      
      // Log progress activity
      try {
        const course = await Course.findById(enrollment.course);
        let lessonDuration = 0;
        if (course) {
          course.modules.forEach(mod => {
            const lesson = mod.lessons.find(l => l._id.toString() === lessonId);
            if (lesson) lessonDuration = lesson.duration || 0;
          });
        }
        
        // Prevent duplicate Progress documents for the same user, course, and lesson
        const existingProgress = await Progress.findOne({
          user: req.user.id,
          course: enrollment.course,
          lessonId
        });

        if (!existingProgress) {
          await Progress.create({
            user: req.user.id,
            course: enrollment.course,
            lessonId,
            minutesLearned: lessonDuration,
            date: new Date()
          });
          
          // Update user's total hours and award points
          await User.findByIdAndUpdate(req.user.id, { 
            $inc: { hoursLearned: Math.round((lessonDuration / 60) * 10) / 10 || 0, points: 10 } 
          });
        }
      } catch (logErr) {
        console.error("Failed to log progress:", logErr);
      }
    }

    // 3. Update current lesson coordinates
    if (moduleIndex !== undefined && lessonIndex !== undefined) {
      enrollment.currentLesson = {
        moduleIndex,
        lessonIndex,
        lessonId: lessonId || enrollment.currentLesson?.lessonId || ''
      };
    }

    // 4. Recalculate course progress percentage
    const course = await Course.findById(enrollment.course);
    if (course && course.modules) {
      const totalLessons = course.modules.reduce(
        (acc, mod) => acc + (mod.lessons?.length || 0),
        0
      );

      enrollment.progress =
        totalLessons > 0
          ? Math.min(100, Math.round((enrollment.completedLessons.length / totalLessons) * 100))
          : 0;

      // 5. Complete Course and Issue Certificate
      if (enrollment.progress >= 100 && !enrollment.isCompleted) {
        enrollment.isCompleted = true;
        enrollment.completedAt = new Date();
        
        try {
          const existingCert = await Certificate.findOne({ enrollment: enrollment._id });
          if (!existingCert) {
            const certId = `ZL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            await Certificate.create({
              user: req.user.id,
              course: enrollment.course,
              enrollment: enrollment._id,
              certificateId: certId,
              skills: course?.tags || []
            });
            
            // Add certificate ID to user's certificates array
            await User.findByIdAndUpdate(req.user.id, { 
              $addToSet: { certificates: certId } 
            });
          }
        } catch (certErr) {
          console.error("Failed to issue certificate:", certErr);
        }
      }
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get instructor stats
export const getInstructorStats = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });

    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({
      course: { $in: courseIds }
    });

    const totalRevenue = enrollments.reduce(
      (acc, e) => acc + e.amountPaid,
      0
    );

    const totalStudents = new Set(
      enrollments.map((e) => e.user.toString())
    ).size;

    res.status(200).json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        totalEnrollments: enrollments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Direct Enrollment (Free/No Payment Session)
// @route   POST /api/enrollments/enroll
// @access  Private
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ user: req.user.id, course: courseId });
    if (existing && (existing.paymentStatus === 'completed' || existing.paymentStatus === 'free')) {
      return res.status(400).json({ success: false, message: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
      paymentStatus: 'free',
      amountPaid: 0
    });

    // Update course and user
    await Promise.all([
      Course.findByIdAndUpdate(courseId, { 
        $inc: { totalStudents: 1 },
        $addToSet: { students: req.user.id }
      }),
      User.findByIdAndUpdate(req.user.id, { $addToSet: { enrolledCourses: courseId } })
    ]);

    // Trigger notification
    try {
      // Notify student
      await dispatchNotification({
        userId: req.user.id,
        type: "courseEnrollments",
        title: "Course Enrolled 🎓",
        message: `You have successfully enrolled in "${course.title}". Enjoy your learning journey!`,
        link: "/student/my-learning"
      });

      // Notify instructor
      if (course.instructor) {
        await dispatchNotification({
          userId: course.instructor,
          type: "courseEnrollments",
          title: "New Student Enrolled! 🎓",
          message: `${req.user.name || 'A student'} has enrolled in your course "${course.title}".`,
          link: "/instructor/students"
        });
      }
    } catch (notifErr) {
      console.error("Enrollment notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Enrolled successfully",
      enrollment
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};