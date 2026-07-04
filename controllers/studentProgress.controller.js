import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import LiveAttendance from '../modules/liveClasses/models/LiveAttendance.js';

// @desc    Get student progress overview
// @route   GET /api/student/progress/overview
// @access  Private/Student
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all enrollments
    const enrollments = await Enrollment.find({ user: userId }).populate('course');
    
    // 2. Basic stats
    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const inProgressCourses = totalEnrolled - completedCourses;
    
    // 3. Calculate overall completion %
    const overallCompletion = totalEnrolled > 0 
      ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / totalEnrolled) 
      : 0;

    // 4. Calculate total watch time (minutes)
    let totalWatchTime = 0;
    enrollments.forEach(enrollment => {
      if (enrollment.course && enrollment.course.modules) {
        enrollment.course.modules.forEach(module => {
          module.lessons.forEach(lesson => {
            if (enrollment.completedLessons.includes(lesson._id.toString())) {
              totalWatchTime += (lesson.duration || 0);
            }
          });
        });
      }
    });

    // 5. Fetch user points and certificates from User model
    const user = await User.findById(userId);

    // 6. Live class participation
    const liveAttendanceCount = await LiveAttendance.countDocuments({ student: userId });

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
        overallCompletion,
        totalWatchTime,
        points: user.points || 0,
        certificates: user.certificates?.length || 0,
        liveAttendanceCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed course progress
// @route   GET /api/student/progress/courses
// @access  Private/Student
export const getCoursesProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    const coursesData = enrollments.map(e => {
      if (!e.course) return null;
      
      const totalLessons = e.course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
      const completedCount = e.completedLessons.length;
      const remainingLessons = totalLessons - completedCount;

      // Find last watched lesson
      let lastWatched = null;
      if (e.currentLesson) {
        const mod = e.course.modules[e.currentLesson.moduleIndex];
        if (mod && mod.lessons[e.currentLesson.lessonIndex]) {
          lastWatched = mod.lessons[e.currentLesson.lessonIndex].title;
        }
      }

      return {
        id: e.course._id,
        enrollmentId: e._id,
        title: e.course.title,
        thumbnail: e.course.thumbnail,
        instructor: e.course.instructor?.name,
        progress: e.progress,
        totalLessons,
        completedLessons: completedCount,
        remainingLessons,
        lastWatched,
        isCompleted: e.isCompleted,
        updatedAt: e.updatedAt
      };
    }).filter(Boolean);

    res.status(200).json({ success: true, data: coursesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get analytics for charts
// @route   GET /api/student/progress/analytics
// @access  Private/Student
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Weekly activity (minutes per day for last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activity = await Progress.aggregate([
      {
        $match: {
          user: req.user._id || req.user.id, // compatibility with different protect middleware
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          minutes: { $sum: "$minutesLearned" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing days
    const weeklyActivity = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = activity.find(a => a._id === dateStr);
      weeklyActivity.push({
        day: dayName,
        date: dateStr,
        minutes: found ? found.minutes : 0
      });
    }

    // Course completion analytics (progress per course for radar/bar chart)
    const enrollments = await Enrollment.find({ user: userId }).populate('course', 'title');
    const courseCompletion = enrollments.map(e => ({
      subject: e.course?.title?.substring(0, 15) + '...',
      fullTitle: e.course?.title,
      A: e.progress,
      fullMark: 100
    }));

    res.status(200).json({
      success: true,
      data: {
        weeklyActivity,
        courseCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent activity activity
// @route   GET /api/student/progress/activity
// @access  Private/Student
export const getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // We'll use Progress logs and Enrollment updates as activity
    const progressLogs = await Progress.find({ user: userId })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(10);

    const activity = progressLogs.map(log => ({
      id: log._id,
      type: 'lesson',
      title: `Watched lesson in ${log.course?.title}`,
      description: `${log.minutesLearned} minutes spent`,
      thumbnail: log.course?.thumbnail,
      date: log.createdAt
    }));

    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
