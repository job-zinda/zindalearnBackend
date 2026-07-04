import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ''
  },
  blockedAt: {
    type: Date
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profilePic: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role !== 'instructor';
    }
  },
  socialLinks: {
    website: String,
    linkedin: String,
    twitter: String,
    github: String
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  hoursLearned: {
    type: Number,
    default: 0
  },
  certificates: {
    type: [String],
    default: []
  },
  points: {
    type: Number,
    default: 0
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  language: {
    type: String,
    default: 'English (US)'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  paymentDetails: {
    bank: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    },
    upi: {
      upiId: String
    },
    preferredMethod: {
      type: String,
      enum: ['bank', 'upi'],
      default: 'bank'
    }
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    liveClassReminders: { type: Boolean, default: true },
    chatMessages: { type: Boolean, default: true },
    courseUpdates: { type: Boolean, default: true },
    newEnrollments: { type: Boolean, default: true },
    newReviews: { type: Boolean, default: true },
    payoutUpdates: { type: Boolean, default: true },
    // New standardized preferences
    courseEnrollments: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    qaQuestions: { type: Boolean, default: true },
    payouts: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    liveClasses: { type: Boolean, default: true }
  },
  privacySettings: {
    showEmail: { type: Boolean, default: true },
    showProfile: { type: Boolean, default: true }
  },
  tempEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  emailOtp: {
    type: String
  },
  emailOtpExpires: {
    type: Date
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  activeSessions: [
    {
      device: { type: String, default: 'Unknown Device' },
      ip: { type: String, default: 'Unknown IP' },
      lastActive: { type: Date, default: Date.now }
    }
  ],
  preferences: {
    darkMode: { type: Boolean, default: false },
    videoQuality: { type: String, enum: ['720p', '1080p', '4K'], default: '1080p' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Add indices for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isApproved: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function(expiresIn) {
  return jwt.sign(
    { id: this._id, role: this.role, tokenVersion: this.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn || process.env.JWT_EXPIRE || '24h' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;
