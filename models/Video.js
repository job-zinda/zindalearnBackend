import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['upload', 'youtube', 'vimeo'],
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publicId: {
    type: String, // Cloudinary public_id
    required: function() { return this.source === 'upload'; }
  },
  mimeType: String,
  fileSize: Number // in bytes
}, { timestamps: true });

// Index for reordering
videoSchema.index({ course: 1, order: 1 });

const Video = mongoose.model('Video', videoSchema);
export default Video;
