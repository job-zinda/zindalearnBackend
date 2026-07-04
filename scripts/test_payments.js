import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { adminService } from '../services/admin.service.js';

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB at:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    console.log('\n--- Running adminService.getPayments() ---');
    const paymentsRes = await adminService.getPayments({ page: 1, limit: 50 });
    console.log('Success! Payments fetched successfully:');
    console.log(`Total count: ${paymentsRes.total}`);
    console.log(JSON.stringify(paymentsRes.payments, null, 2));

  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
