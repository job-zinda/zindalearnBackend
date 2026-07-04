import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // 1. Migrate Courses
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses to migrate.`);

    for (const course of courses) {
      if (course.price < 500) {
        const oldPrice = course.price;
        course.price = Math.round(course.price * 83);
        course.discountPrice = Math.round(course.discountPrice * 83);
        course.currency = 'INR';
        await course.save();
        console.log(`Migrated Course: ${course.title} | ${oldPrice} -> ${course.price}`);
      } else {
        course.currency = 'INR';
        await course.save();
        console.log(`Updated Course currency only: ${course.title}`);
      }
    }

    // 2. Migrate Enrollments
    const enrollments = await Enrollment.find({});
    console.log(`Found ${enrollments.length} enrollments to migrate.`);

    for (const enrollment of enrollments) {
      if (enrollment.amountPaid < 500 && enrollment.amountPaid > 0) {
        const oldAmount = enrollment.amountPaid;
        enrollment.amountPaid = Math.round(enrollment.amountPaid * 83);
        enrollment.currency = 'INR';
        await enrollment.save();
        console.log(`Migrated Enrollment: ${enrollment._id} | ${oldAmount} -> ${enrollment.amountPaid}`);
      } else {
        enrollment.currency = 'INR';
        await enrollment.save();
        console.log(`Updated Enrollment currency only: ${enrollment._id}`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
