import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// @desc    Get student settings
// @route   GET /api/student/settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student subscription
// @route   GET /api/student/subscription
export const getSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.id });
    
    // If no subscription exists, create a default "Free" one
    if (!subscription) {
      subscription = await Subscription.create({
        user: req.user.id,
        plan: 'Free',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }
    
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, bio, username, phone, language, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is changing
    const emailChanged = email && email !== user.email;

    if (emailChanged) {
      // Check for duplicate email
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use by another account' });
      }
      user.email = email;
      user.emailVerified = false;
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (language) user.language = language;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: emailChanged ? 'Profile updated. Please verify your new email.' : 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student password
// @route   PUT /api/student/password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student preferences (dark mode, video quality)
// @route   PUT /api/student/preferences
export const updatePreferences = async (req, res) => {
  try {
    const { darkMode, videoQuality, twoFactorEnabled } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (darkMode !== undefined) user.preferences.darkMode = darkMode;
    if (videoQuality) user.preferences.videoQuality = videoQuality;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

    await user.save();

    res.status(200).json({ success: true, data: user.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/student/notifications
export const updateNotifications = async (req, res) => {
  try {
    const { emailNotifications, liveClassReminders, chatMessages, courseUpdates } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (emailNotifications !== undefined) user.notificationPreferences.emailNotifications = emailNotifications;
    if (liveClassReminders !== undefined) user.notificationPreferences.liveClassReminders = liveClassReminders;
    if (chatMessages !== undefined) user.notificationPreferences.chatMessages = chatMessages;
    if (courseUpdates !== undefined) user.notificationPreferences.courseUpdates = courseUpdates;

    await user.save();

    res.status(200).json({ success: true, data: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student account
// @route   DELETE /api/student/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // In a real app, you might want to mark as deleted or remove all related data
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send email verification link
// @route   POST /api/student/settings/send-verification-email
export const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Rate limiting: prevent resend within 2 minutes
    if (user.emailVerificationExpires && user.emailVerificationExpires > new Date(Date.now() - 28 * 60 * 1000)) {
      const timeSinceGenerated = Date.now() - (user.emailVerificationExpires.getTime() - 30 * 60 * 1000);
      if (timeSinceGenerated < 2 * 60 * 1000) {
        return res.status(429).json({ success: false, message: 'Please wait 2 minutes before requesting another verification email' });
      }
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Build verification URL (frontend route)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${rawToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Zinda Learn</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Email Verification</p>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #18181b; font-size: 20px; margin: 0 0 12px; font-weight: 700;">Verify your email address</h2>
          <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            Hi ${user.name || 'there'},<br/>Click the button below to verify <strong>${user.email}</strong>. This link expires in 30 minutes.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(124,58,237,0.3);">
              Verify Email
            </a>
          </div>
          <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
            If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${verifyUrl}" style="color: #7c3aed; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
        <div style="background: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #f0f0f0;">
          <p style="color: #a1a1aa; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Zinda Learn. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Verify your email — Zinda Learn',
      html,
      message: `Verify your email by visiting: ${verifyUrl}`
    });

    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

// @desc    Verify email with token
// @route   POST /api/student/settings/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification link is invalid or has expired' 
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Email verification failed' });
  }
};

// @desc    Toggle course in student wishlist
// @route   POST /api/student/settings/wishlist/toggle
export const toggleWishlist = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const index = user.wishlist.indexOf(courseId);
    let isWishlisted = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      isWishlisted = false;
    } else {
      user.wishlist.push(courseId);
      isWishlisted = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isWishlisted ? 'Course added to wishlist' : 'Course removed from wishlist',
      isWishlisted,
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


