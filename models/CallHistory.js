import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['missed', 'rejected', 'completed', 'busy', 'failed'],
    required: true
  },
  duration: {
    type: Number, // In seconds
    default: 0
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'audio'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, { timestamps: true });

const CallHistory = mongoose.model('CallHistory', callHistorySchema);
export default CallHistory;
