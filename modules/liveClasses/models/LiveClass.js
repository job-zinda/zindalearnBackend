import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  meetingLink: {
    type: String,
    required: [true, 'Meeting link is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended', 'cancelled'],
    default: 'upcoming'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  notifiedBeforeStart: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Virtuals for backwards compatibility with HH:mm and YYYY-MM-DD strings in the instructor UI
liveClassSchema.virtual('startTimeStr').get(function() {
  if (!this.startTime) return '';
  const date = new Date(this.startTime);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
});

liveClassSchema.virtual('scheduledDateStr').get(function() {
  if (!this.startTime) return '';
  return new Date(this.startTime).toISOString().split('T')[0];
});

// Configure toJSON and toObject conversion transforms to automatically resolve status
const resolveStatus = (doc, ret) => {
  if (ret.status !== 'cancelled') {
    const now = new Date();
    if (ret.startTime && ret.endTime) {
      const start = new Date(ret.startTime);
      const end = new Date(ret.endTime);
      if (now >= start && now <= end) {
        ret.status = 'live';
      } else if (now < start) {
        ret.status = 'upcoming';
      } else {
        ret.status = 'ended';
      }
    }
  }
  // Convert startTime and scheduledDate virtual names back for UI compatibility
  ret.startTimeStr = doc.startTimeStr;
  ret.scheduledDateStr = doc.scheduledDateStr;
  return ret;
};

liveClassSchema.set('toJSON', { virtuals: true, transform: resolveStatus });
liveClassSchema.set('toObject', { virtuals: true, transform: resolveStatus });

// Indexing for faster queries
liveClassSchema.index({ instructor: 1, status: 1 });
liveClassSchema.index({ course: 1, status: 1 });
liveClassSchema.index({ startTime: 1 });

const LiveClass = mongoose.model('LiveClass', liveClassSchema);
export default LiveClass;
