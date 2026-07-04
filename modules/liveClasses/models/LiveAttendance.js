import mongoose from 'mongoose';

const liveAttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  liveClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveClass',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  }
}, { timestamps: true });

// Ensure a student has only one attendance record per live class for simplicity
// or we could track multiple joins/leaves if needed.
liveAttendanceSchema.index({ student: 1, liveClass: 1 }, { unique: true });

const LiveAttendance = mongoose.model('LiveAttendance', liveAttendanceSchema);
export default LiveAttendance;
