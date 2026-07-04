import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  type: {
    type: String,
    enum: ['direct', 'broadcast'],
    default: 'direct'
  },
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

// One conversation per student + instructor + course for direct chats
// Note: We use a custom logic to ensure participants are always [student, instructor] or similar
conversationSchema.index({ participants: 1, course: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
