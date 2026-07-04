import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

dotenv.config({ path: '../.env' });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find a user who has enrollments
    const enrollments = await Enrollment.find({})
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name avatar bio"
        }
      })
      .sort({ createdAt: -1 })
      .limit(1);

    if (enrollments.length === 0) {
      console.log('No enrollments found');
      process.exit(0);
    }

    console.log('Got an enrollment', enrollments[0]._id);

    const validEnrollments = enrollments.filter(e => e.course !== null);

    // Convert to object to include virtuals on the course
    const enrollmentsWithVirtuals = validEnrollments.map(e => {
      const obj = e.toObject();
      if (obj.course) {
        const course = e.course;
        // console.log('course type:', typeof course, course instanceof mongoose.Document);
        if (typeof course.toObject === 'function') {
          obj.course = course.toObject({ virtuals: true });
        } else {
          console.log('course has NO toObject');
        }
      }
      return obj;
    });

    console.log('Success!', enrollmentsWithVirtuals[0].course._id);

    process.exit(0);
  } catch (error) {
    console.error('Test Query failed:', error);
    process.exit(1);
  }
}

test();
