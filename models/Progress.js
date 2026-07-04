import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: String
  },
  minutesLearned: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient querying of user's daily progress
progressSchema.index({ user: 1, date: -1 });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
