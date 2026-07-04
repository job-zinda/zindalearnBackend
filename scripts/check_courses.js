import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Course from '../models/Course.js';

dotenv.config();

const checkCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const courses = await Course.find({});
    console.log(`Total courses: ${courses.length}`);
    
    courses.forEach(c => {
      console.log(`- Title: ${c.title}, Status: ${c.status}, Approved: ${c.isApproved}, Deleted: ${c.isDeleted}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCourses();
