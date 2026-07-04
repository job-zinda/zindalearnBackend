import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    type: String // lesson IDs
  }],
  currentLesson: {
    moduleIndex: { type: Number, default: 0 },
    lessonIndex: { type: Number, default: 0 },
    lessonId: { type: String, default: '' }
  },
  lastVideoTimestamp: {
    type: Number,
    default: 0
  },
  lastWatchedAt: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'free'],
    default: 'completed'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },
  paymentId: {
    type: String
  },
  accessType: {
    type: String,
    enum: ['purchase', 'manual'],
    default: 'purchase'
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  grantedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;

