import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a banner title'],
    trim: true,
    maxlength: [80, 'Title cannot exceed 80 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a banner description'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide a banner image'],
  },
  linkUrl: {
    type: String,
    trim: true,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
