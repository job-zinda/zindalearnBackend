import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Payout from '../models/Payout.js';
import { adminService } from '../services/admin.service.js';

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB at:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const enrollmentCount = await Enrollment.countDocuments();
    const payoutCount = await Payout.countDocuments();

    console.log('--- Database Stats ---');
    console.log('Users:', userCount);
    console.log('Courses:', courseCount);
    console.log('Enrollments:', enrollmentCount);
    console.log('Payouts:', payoutCount);

    console.log('\n--- Running adminService.getDashboardStats() ---');
    const stats = await adminService.getDashboardStats();
    console.log('Success! Dashboard Stats fetched successfully:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
