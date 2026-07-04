import Payout from '../models/Payout.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import SupportTicket from '../models/SupportTicket.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import fs from 'fs';

// ── PAYOUTS ──────────────────────────────────────────────────────────────────

export const getInstructorPayouts = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // 1. Get all enrollments for this instructor's courses
    const myCourses = await Course.find({ instructor: instructorId }).select('_id');
    const courseIds = myCourses.map(c => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 });

    // 2. Calculate earnings
    const totalRevenue = enrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
    const platformFeeRate = 0.1; // 10% platform fee
    const instructorEarnings = totalRevenue * (1 - platformFeeRate);

    // 3. Get payout history
    const payouts = await Payout.find({ instructor: instructorId }).sort({ createdAt: -1 });
    const totalWithdrawn = payouts
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingWithdrawn = payouts
      .filter(p => p.status === 'pending')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const availableBalance = instructorEarnings - totalWithdrawn - pendingWithdrawn;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        instructorEarnings,
        totalWithdrawn,
        pendingWithdrawn,
        availableBalance,
        thisMonthEarnings: 0 // Logic to calculate current month can be added
      },
      payouts,
      earnings: enrollments.map(e => ({
        studentName: e.user?.name,
        courseTitle: e.course?.title,
        amount: e.course?.price,
        platformFee: (e.course?.price || 0) * platformFeeRate,
        netEarnings: (e.course?.price || 0) * (1 - platformFeeRate),
        status: 'Success',
        date: e.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const instructorId = req.user.id;

    if (amount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500' });
    }

    // Check balance
    const user = await User.findById(instructorId);
    if (!user.paymentDetails?.[paymentMethod]) {
      return res.status(400).json({ success: false, message: `Please add your ${paymentMethod} details in settings first` });
    }

    // Logic to verify balance again (similar to getInstructorPayouts)
    // For production, this should be calculated on the fly or stored in a ledger
    
    const newPayout = await Payout.create({
      instructor: instructorId,
      amount,
      paymentMethod: paymentMethod === 'bank' ? 'bank_transfer' : 'upi',
      paymentDetails: paymentMethod === 'bank' ? user.paymentDetails.bank : user.paymentDetails.upi,
      status: 'pending'
    });

    res.json({ success: true, payout: newPayout, message: 'Withdrawal request submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── REVIEWS ──────────────────────────────────────────────────────────────────

export const getInstructorReviews = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const myCourses = await Course.find({ instructor: instructorId }).select('_id title');
    const courseIds = myCourses.map(c => c._id);

    const rawReviews = await Review.find({ course: { $in: courseIds } })
      .populate('user', 'name profilePic avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const reviews = rawReviews.map(r => ({
      ...r,
      review: (r.review || r.comment || 'No written feedback provided').trim()
    }));

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if(r.rating >= 1 && r.rating <= 5) distribution[5 - r.rating]++; });

    res.json({
      success: true,
      analytics: {
        totalReviews,
        avgRating,
        distribution
      },
      reviews,
      courses: myCourses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── SETTINGS ─────────────────────────────────────────────────────────────────

export const getInstructorSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Log/ensure current session is listed in activeSessions for demo purposes
    const userAgent = req.headers['user-agent'] || 'Browser Session';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown IP';
    const currentSessionExists = user.activeSessions.some(s => s.device === userAgent && s.ip === ip);
    if (!currentSessionExists) {
      user.activeSessions.push({ device: userAgent, ip, lastActive: new Date() });
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInstructorProfile = async (req, res) => {
  try {
    const { name, bio, phone, socialLinks, privacySettings, paymentDetails, notificationPreferences } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Enforce validations
    if (phone && (phone.length < 10 || phone.length > 15)) {
      return res.status(400).json({ success: false, message: 'Phone number must be between 10 and 15 digits' });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({ success: false, message: 'Bio cannot exceed 500 characters' });
    }

    // Helper to validate URLs
    const isValidUrl = (url) => {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (socialLinks) {
      for (const key of Object.keys(socialLinks)) {
        if (socialLinks[key] && !isValidUrl(socialLinks[key])) {
          return res.status(400).json({ success: false, message: `Invalid URL format for ${key}` });
        }
      }
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (privacySettings) user.privacySettings = { ...user.privacySettings, ...privacySettings };
    if (paymentDetails) user.paymentDetails = { ...user.paymentDetails, ...paymentDetails };
    if (notificationPreferences) user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };

    await user.save();
    res.status(200).json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInstructorAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Size validation (2MB limit)
    if (req.file.size > 2 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'File size must not exceed 2MB' });
    }

    // Type validation
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Only images (.jpg, .png, .gif) are allowed' });
    }

    const result = await cloudinaryService.uploadFile(req.file.path, 'zinda-learn/avatars');
    fs.unlinkSync(req.file.path);

    const user = await User.findById(req.user.id);
    user.avatar = result.secure_url;
    user.profilePic = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      avatar: result.secure_url,
      user,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid new email address' });
    }

    // Check if email already in use
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already in use' });
    }

    const user = await User.findById(req.user.id);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.tempEmail = newEmail.toLowerCase();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #7c3aed; text-align: center;">Verify Your New Email</h2>
        <p>Hi ${user.name || 'Instructor'},</p>
        <p>You requested to change your Zinda Learn email to <strong>${newEmail}</strong>. Please use the following One-Time Password (OTP) to complete the verification:</p>
        <div style="font-size: 32px; font-weight: 800; text-align: center; margin: 30px 0; letter-spacing: 4px; color: #7c3aed;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">This code is valid for 10 minutes. If you did not request this change, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: newEmail,
      subject: 'Email Change Verification Code — Zinda Learn',
      html,
      message: `Your Zinda Learn OTP is: ${otp}`
    });

    res.status(200).json({ success: true, message: 'OTP sent to your new email address' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user.tempEmail || !user.emailOtp) {
      return res.status(400).json({ success: false, message: 'No pending email change request found' });
    }

    if (user.emailOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    if (user.emailOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification OTP' });
    }

    // Check again if email is already in use by another account
    const duplicate = await User.findOne({ email: user.tempEmail });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Email address is already in use by another account' });
    }

    user.email = user.tempEmail;
    user.emailVerified = true;
    user.tempEmail = undefined;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, user, message: 'Email updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.activeSessions = []; // clear sessions list
    await user.save();

    res.status(200).json({ success: true, message: 'Logged out of all devices successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── HELP CENTER ──────────────────────────────────────────────────────────────

export const submitSupportTicket = async (req, res) => {
  try {
    const { subject, category, message, attachment } = req.body;
    const ticket = await SupportTicket.create({
      user: req.user.id,
      createdByRole: 'instructor',
      subject,
      category,
      message,
      attachment
    });
    res.json({ success: true, ticket, message: 'Ticket submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstructorTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DASHBOARD & COURSES ──────────────────────────────────────────────────────

export const getInstructorCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;

    // Build query
    const query = { 
      instructor: req.user.id, 
      isDeleted: { $ne: true } 
    };

    // Add status filter if provided and not 'All'
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    // Add search functionality if provided
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Get total count for pagination
    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limit);

    const courses = await Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    res.json({ 
      success: true, 
      courses,
      totalCourses,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstructorDashboardStats = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const courses = await Course.find({ instructor: instructorId, isDeleted: { $ne: true } });

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
    
    // Revenue logic matching getInstructorPayouts for consistency
    const enrollments = await Enrollment.find({ course: { $in: courses.map(c => c._id) } })
      .populate('course', 'price');
    
    const totalRevenue = enrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
    const platformFeeRate = 0.1;
    const monthlyEarnings = totalRevenue * (1 - platformFeeRate); // This could be filtered by date

    res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalRevenue,
        monthlyEarnings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.user?.id || req.user?._id;
    if (!instructorId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // 1. Fetch instructor courses
    const myCourses = await Course.find({ instructor: instructorId, isDeleted: { $ne: true } }).select('_id');
    if (!myCourses || myCourses.length === 0) {
      return res.json({
        success: true,
        students: []
      });
    }
    const courseIds = myCourses.map(c => c._id);

    // 2. Fetch enrollments for those courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email avatar profilePic')
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 });

    // 3. Rebuild student info dynamically using Enrollment as the single source of truth
    const formattedStudents = enrollments
      .filter(e => e && e.user && e.course) // filter out database inconsistencies
      .map(e => {
        const progressVal = e.progress ?? 0;
        const isCompletedVal = e.isCompleted ?? false;
        const completedLessonsCount = e.completedLessons ? e.completedLessons.length : 0;

        // Strict backend-derived status
        const status = isCompletedVal
          ? "Completed"
          : progressVal > 0
          ? "In Progress"
          : "Not Started";

        return {
          enrollmentId: e._id,
          student: {
            _id: e.user?._id,
            name: e.user?.name || "Unknown Student",
            email: e.user?.email || "",
            avatar: e.user?.avatar || e.user?.profilePic || ""
          },
          course: {
            _id: e.course?._id,
            title: e.course?.title || "Unknown Course",
            thumbnail: e.course?.thumbnail || ""
          },
          progress: progressVal,
          completedLessons: completedLessonsCount,
          currentLesson: {
            moduleIndex: e.currentLesson?.moduleIndex ?? 0,
            lessonIndex: e.currentLesson?.lessonIndex ?? 0
          },
          isCompleted: isCompletedVal,
          enrolledAt: e.createdAt,
          updatedAt: e.updatedAt,
          status
        };
      });

    res.json({
      success: true,
      students: formattedStudents
    });
  } catch (error) {
    console.error("Error in getInstructorStudents:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
