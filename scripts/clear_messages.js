import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

dotenv.config();

async function clearMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const msgCount = await Message.deleteMany({});
    const convCount = await Conversation.deleteMany({});
    
    console.log(`Cleared ${msgCount.deletedCount} messages and ${convCount.deletedCount} conversations.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear messages:', error);
    process.exit(1);
  }
}

clearMessages();
