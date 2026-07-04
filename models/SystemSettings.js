import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // Platform Controls
  maintenanceMode: { 
    type: Boolean, 
    default: false 
  },
  allowStudentRegistration: { 
    type: Boolean, 
    default: true 
  },
  allowInstructorApplications: { 
    type: Boolean, 
    default: true 
  },
  enablePublicCourseBrowsing: { 
    type: Boolean, 
    default: true 
  },
  
  // Security Controls
  requireEmailVerification: { 
    type: Boolean, 
    default: false 
  },
  enableGoogleLogin: { 
    type: Boolean, 
    default: true 
  },
  jwtSessionTimeout: { 
    type: Number, 
    default: 24 // hours
  },
  
  // Notification Controls
  enableEmailService: { 
    type: Boolean, 
    default: true 
  },
  adminAlertEmails: { 
    type: String, 
    default: 'admin@zindalearn.com' 
  },
  
  // System Metadata
  platformVersion: { 
    type: String, 
    default: '1.0.0' 
  }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
