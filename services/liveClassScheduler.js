import LiveClass from '../modules/liveClasses/models/LiveClass.js';
import { dispatchNotification } from './notificationDispatcher.js';

/**
 * Start the live class alert polling loop
 */
export const startLiveClassScheduler = () => {
  console.log('⏰ [Scheduler Engine] Live class starting notifications loop active (checks every 2 minutes)');
  
  // Run checks every 2 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

      // Find active live classes starting in the next 15 minutes that haven't been notified yet
      const upcomingClasses = await LiveClass.find({
        startTime: { $gte: now, $lte: fifteenMinutesFromNow },
        notifiedBeforeStart: { $ne: true },
        isDeleted: false
      }).populate('course');

      for (const liveClass of upcomingClasses) {
        // Prevent double notification instantly
        liveClass.notifiedBeforeStart = true;
        await liveClass.save();

        console.log(`⏰ [Scheduler Engine] Live class starting soon: "${liveClass.title}". Dispatching alerts.`);

        // 1. Notify instructor
        if (liveClass.instructor) {
          await dispatchNotification({
            userId: liveClass.instructor,
            type: 'liveClasses',
            title: 'Upcoming Live Session Starting Soon! 🎥',
            message: `Your scheduled live session "${liveClass.title}" for course "${liveClass.course?.title || 'Course'}" starts in 15 minutes.`,
            link: '/instructor/live-classes'
          });
        }

        // 2. Notify all enrolled students
        if (liveClass.enrolledStudents && liveClass.enrolledStudents.length > 0) {
          const studentPromises = liveClass.enrolledStudents.map(studentId =>
            dispatchNotification({
              userId: studentId,
              type: 'liveClasses',
              title: 'Live Session Starting in 15 mins! 🎥',
              message: `The live class "${liveClass.title}" for "${liveClass.course?.title || 'your course'}" is starting soon. Prepare your setup!`,
              link: `/student/course/${liveClass.course?._id || liveClass.course}/player`
            })
          );
          await Promise.all(studentPromises).catch(err => 
            console.error('[Scheduler Engine] Error dispatching alerts to students:', err.message)
          );
        }
      }
    } catch (err) {
      console.error('[Scheduler Engine] Failed scheduled live class check iteration:', err);
    }
  }, 120000); // 2 minutes check frequency
};
