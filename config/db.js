import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These are set by Mongoose 8+ defaults but explicit for clarity
      serverSelectionTimeoutMS: 10000, // 10s to find a server
      socketTimeoutMS: 45000,           // 45s for operations
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);

    // Log reconnection events — important for debugging Atlas connection drops on EC2
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from Atlas. Mongoose will attempt to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected to Atlas successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });
  } catch (error) {
    console.error(` MongoDB Error: ${error.message}`);
    // Exit so PM2 restarts the process — only on initial connection failure
    process.exit(1);
  }
};

export default connectDB;
