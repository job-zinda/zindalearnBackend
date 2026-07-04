import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import sendEmail from "../utils/sendEmail.js";
import * as otpService from "../services/otpService.js";
import SystemSettings from "../models/SystemSettings.js";

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ success: false, message: "Email is required" });

    const email = rawEmail.toLowerCase().trim();

    let user = await User.findOne({ email }).select("+password");
    if (user && user.isVerified && user.password) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    try {
      const otp = otpService.generateOTP();
      await otpService.saveOTP(email, otp);

      await sendEmail({
        email,
        subject: "Verification OTP - Zinda Learn",
        message: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `<h3>Verification OTP</h3><p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
      });
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
      console.error("OTP Generation/Sending Error:", err);
      if (err.message.includes('wait before requesting')) {
        return res.status(429).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Failed to process OTP request" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    try {
      await otpService.verifyOTP(email, otp);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    const email = rawEmail.toLowerCase().trim();

    // Check settings controls
    const systemSettings = await SystemSettings.findOne();
    if (systemSettings) {
      const actualRole = role || 'student';
      if (actualRole === 'student' && !systemSettings.allowStudentRegistration) {
        return res.status(403).json({
          success: false,
          message: "Student registration is currently disabled by the administrator."
        });
      }
      if (actualRole === 'instructor' && !systemSettings.allowInstructorApplications) {
        return res.status(403).json({
          success: false,
          message: "Instructor applications are currently closed."
        });
      }
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isVerified) {
      return res.status(400).json({ success: false, message: "Email not verified" });
    }

    if (user.password) {
      return res.status(400).json({ success: false, message: "User already registered" });
    }

    user.name = name;
    user.password = password;
    user.role = role || "student";
    
    // Explicitly set approval status for instructors
    if (user.role === 'instructor') {
      user.isApproved = false;
    } else {
      user.isApproved = true;
    }

    await user.save();

    const timeout = systemSettings?.jwtSessionTimeout ? `${systemSettings.jwtSessionTimeout}h` : undefined;
    const token = user.generateToken(timeout);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register user without email/OTP verification (used by the mobile app)
export const registerDirect = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    if (!name || !rawEmail || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    const email = rawEmail.toLowerCase().trim();

    const systemSettings = await SystemSettings.findOne();
    if (systemSettings) {
      const actualRole = role || 'student';
      if (actualRole === 'student' && !systemSettings.allowStudentRegistration) {
        return res.status(403).json({
          success: false,
          message: "Student registration is currently disabled by the administrator."
        });
      }
      if (actualRole === 'instructor' && !systemSettings.allowInstructorApplications) {
        return res.status(403).json({
          success: false,
          message: "Instructor applications are currently closed."
        });
      }
    }

    const existing = await User.findOne({ email }).select("+password");
    if (existing && existing.password) {
      return res.status(400).json({ success: false, message: "User already registered" });
    }

    const user = existing || new User({ email });
    user.name = name;
    user.password = password;
    user.role = role || "student";
    user.isVerified = true;
    user.isApproved = user.role !== 'instructor';

    await user.save();

    const timeout = systemSettings?.jwtSessionTimeout ? `${systemSettings.jwtSessionTimeout}h` : undefined;
    const token = user.generateToken(timeout);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // Fetch user and explicitly select password (trim email to avoid whitespace issues)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const systemSettings = await SystemSettings.findOne();
    const timeout = systemSettings?.jwtSessionTimeout ? `${systemSettings.jwtSessionTimeout}h` : undefined;

    if (user.isBlocked) {
      const token = user.generateToken(timeout);
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been suspended",
        reason: user.blockedReason || "Violation of platform policies",
        blockedReason: user.blockedReason || "Violation of platform policies",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profilePic: user.profilePic,
          isBlocked: true,
          blockedReason: user.blockedReason || "Violation of platform policies"
        }
      });
    }

    if (user.role === "instructor" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Instructor account is pending approval"
      });
    }

    const token = user.generateToken(timeout);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("enrolledCourses");

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout (current device)
// JWT is stateless, so a normal logout is client-side (delete the stored token).
// This endpoint acknowledges the logout and removes the current device's session
// from activeSessions when a `device` is provided.
export const logout = async (req, res) => {
  try {
    const { device } = req.body || {};

    if (device) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { activeSessions: { device } }
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, avatar, socialLinks } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, phone, avatar, socialLinks },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    const systemSettings = await SystemSettings.findOne();
    const timeout = systemSettings?.jwtSessionTimeout ? `${systemSettings.jwtSessionTimeout}h` : undefined;
    const token = user.generateToken(timeout);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { name, email, photo, token } = req.body;

    const systemSettings = await SystemSettings.findOne();
    if (systemSettings && !systemSettings.enableGoogleLogin) {
      return res.status(403).json({
        success: false,
        message: "Google login is currently disabled by the administrator."
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required"
      });
    }

    // 1. Verify Firebase token
    let decodedToken;
    try {
      // Check if Firebase Admin is initialized
      if (admin && admin.apps.length > 0) {
        decodedToken = await admin.auth().verifyIdToken(token);
      } else if (process.env.NODE_ENV === 'development') {
        // BYPASS for development if service account is missing
        console.warn("WARNING: Firebase Admin not initialized. Bypassing token verification in development mode.");
        decodedToken = { email, name }; 
      } else {
        throw new Error("Firebase Admin SDK not initialized");
      }
    } catch (error) {
      console.error("Firebase Verification Error:", error.message);
      return res.status(401).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? `Firebase Error: ${error.message}. Please check serviceAccountKey.json`
          : "Invalid or expired Firebase token"
      });
    }

    if (!decodedToken) {
      return res.status(401).json({
        success: false,
        message: "Could not verify Firebase token"
      });
    }

    // 2. Check user in database
    let user = await User.findOne({ email });

    if (!user) {
      // 3. Create new user if not exists
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      const role = req.body.role || "student";
      
      user = await User.create({
        name,
        email,
        profilePic: photo || "",
        avatar: photo || "",
        role: role,
        password: randomPassword,
        isVerified: true,
        isApproved: role !== 'instructor' // Instructors need manual approval
      });
    } else {
      // Update photo if it changed
      if (photo && (user.profilePic !== photo)) {
        user.profilePic = photo;
        user.avatar = photo;
        await user.save();
      }
    }

    const timeout = systemSettings?.jwtSessionTimeout ? `${systemSettings.jwtSessionTimeout}h` : undefined;

    if (user.isBlocked) {
      const jwtToken = user.generateToken(timeout);
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been suspended",
        reason: user.blockedReason || "Violation of platform policies",
        blockedReason: user.blockedReason || "Violation of platform policies",
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profilePic: user.profilePic,
          isBlocked: true,
          blockedReason: user.blockedReason || "Violation of platform policies"
        }
      });
    }

    if (user.role === 'instructor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your instructor account is pending approval."
      });
    }

    // 4. Generate JWT for our app
    const jwtToken = user.generateToken(timeout);

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason
      }
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during Google login"
    });
  }
};
