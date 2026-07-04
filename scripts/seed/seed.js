import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedUsers } from '../user.seed.js';
import { seedCourses } from '../course.seed.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Seed: Connected to MongoDB');

    const { instructor } = await seedUsers();
    await seedCourses(instructor._id);

    console.log(' Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
