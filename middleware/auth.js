import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes (verify token)
// Protect routes (verify token)
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // Check token version consistency (logout of all devices)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out from other devices"
      });
    }

    if (user.isBlocked) {
      const isSupportRoute = req.originalUrl && req.originalUrl.includes('/api/support');
      if (!isSupportRoute) {
        return res.status(403).json({
          success: false,
          blocked: true,
          message: "Your account has been suspended",
          reason: user.blockedReason || "Violation of platform policies",
          blockedReason: user.blockedReason || "Violation of platform policies"
        });
      }
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// Optional protect (don't error if no token)
export const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, just proceed without req.user
    next();
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - User data missing"
      });
    }

    // Check role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${req.user.role}`
      });
    }

    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
};

export const isInstructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Instructors only' });
  }
};

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Students only' });
  }
};

export const isApprovedInstructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor' && req.user.isApproved) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied: Your instructor account is pending approval' 
    });
  }
};