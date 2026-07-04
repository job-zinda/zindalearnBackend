import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const courses = await Course.find().select('title modules');
    console.log(`Found ${courses.length} courses`);

    for (const course of courses) {
      console.log(`\nCourse: ${course.title} (ID: ${course._id})`);
      if (!course.modules || course.modules.length === 0) {
        console.log(`  -> NO MODULES`);
        continue;
      }
      console.log(`  -> Modules count: ${course.modules.length}`);
      
      let totalLessons = 0;
      course.modules.forEach((mod, mIndex) => {
        console.log(`    Module ${mIndex}: ${mod.title} - Lessons: ${mod.lessons?.length || 0}`);
        if (mod.lessons) {
          mod.lessons.forEach((l, lIndex) => {
            console.log(`      Lesson ${lIndex}: ${l.title} - Video: ${l.videoUrl || 'NONE'} - Type: ${l.type}`);
          });
          totalLessons += mod.lessons.length;
        }
      });
      console.log(`  -> Total lessons: ${totalLessons}`);
    }

    const enrollments = await Enrollment.find().populate('course user');
    console.log(`\nFound ${enrollments.length} enrollments`);
    for (const e of enrollments) {
      console.log(`Enrollment ID: ${e._id}`);
      console.log(`  User: ${e.user?.name} (${e.user?.email})`);
      console.log(`  Course: ${e.course?.title}`);
      console.log(`  Current Lesson: moduleIndex=${e.currentLesson?.moduleIndex}, lessonIndex=${e.currentLesson?.lessonIndex}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

run();
