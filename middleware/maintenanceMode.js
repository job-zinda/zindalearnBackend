import SystemSettings from '../models/SystemSettings.js';
import jwt from 'jsonwebtoken';

export const checkMaintenance = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne();
    if (settings && settings.maintenanceMode) {
      // Expose admin paths, health check, public settings query, and auth paths
      const isAdminRoute = req.originalUrl.startsWith('/api/admin');
      const isAuthRoute = req.originalUrl.startsWith('/api/auth');
      const isPublicSettings = req.originalUrl === '/api/public/settings';
      const isHealth = req.originalUrl === '/api/health';

      if (isAdminRoute || isAuthRoute || isPublicSettings || isHealth) {
        return next();
      }

      // Check if user is an admin by parsing the JWT token from authorization header
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.role === 'admin') {
            return next();
          }
        } catch (jwtErr) {
          // Token is invalid/expired, let it block
        }
      }

      return res.status(503).json({
        success: false,
        maintenance: true,
        message: 'Platform is currently undergoing scheduled maintenance. Please try again later.'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
