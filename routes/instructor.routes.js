import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getInstructorPayouts,
  requestWithdrawal,
  getInstructorReviews,
  getInstructorSettings,
  updateInstructorProfile,
  updateInstructorAvatar,
  changePassword,
  requestEmailChange,
  verifyEmailChangeOtp,
  logoutAllDevices,
  submitSupportTicket,
  getInstructorTickets,
  getInstructorCourses,
  getInstructorDashboardStats,
  getInstructorStudents
} from '../controllers/instructor.controller.js';
import {
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// All routes are protected and restricted to instructors
router.use(protect);
router.use(authorize('instructor', 'admin'));

// Payouts
router.get('/payouts', getInstructorPayouts);
router.post('/withdraw', requestWithdrawal);

// Reviews
router.get('/reviews', getInstructorReviews);

// Settings & Profile
router.get('/settings', getInstructorSettings);
router.put('/profile', updateInstructorProfile);
router.put('/avatar', upload.single('file'), updateInstructorAvatar);
router.put('/change-password', changePassword);
router.post('/request-email-change', requestEmailChange);
router.post('/verify-email-otp', verifyEmailChangeOtp);
router.post('/logout-all', logoutAllDevices);

// Dashboard & Courses
router.get('/my-courses', getInstructorCourses);
router.get('/stats', getInstructorDashboardStats);
router.get('/students', getInstructorStudents);
router.post('/course', createCourse);
router.put('/course/:id', updateCourse);
router.delete('/course/:id', deleteCourse);

// Help Center / Support
router.post('/support/tickets', submitSupportTicket);
router.get('/support/tickets', getInstructorTickets);

export default router;
