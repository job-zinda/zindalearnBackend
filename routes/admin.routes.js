import express from 'express';
const router = express.Router();
import { 
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
  getAllUsers,
  blockUser,
  unblockUser,
  blockCourse,
  unblockCourse,
  deleteUser,
  restoreUser,
  createUser,
  updateUser,
  getAllCourses,
  deleteCourse,
  updateCourseStatus,
  getPendingCourses,
  approveCourse,
  declineCourse,
  getDashboardStats,
  getPayments,
  getPayouts,
  updatePayoutStatus,
  getStudents,
  getStudentStats,
  getTutors,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/admin.controller.js';
import {
  grantEnrollment,
  revokeEnrollment,
  getEnrollmentHistory
} from '../controllers/adminEnrollmentController.js';
import { protect, authorize } from '../middleware/auth.js';

// All routes require auth + admin role
router.use(protect, authorize('admin'));

// 1. Instructor Approval System
router.get('/instructors/pending', getPendingInstructors);
router.put('/instructor/:id/approve', approveInstructor);
router.delete('/instructor/:id', rejectInstructor);

// 2. Student Management
router.get('/students', getStudents);
router.get('/students/stats', getStudentStats);
router.get('/tutors', getTutors);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.patch('/users/:id/delete', deleteUser);
router.patch('/users/:id/restore', restoreUser);

// 3. Course Management
router.get('/courses', getAllCourses);
router.get('/courses/pending', getPendingCourses);
router.delete('/courses/:id', deleteCourse);
router.patch('/courses/:id/status', updateCourseStatus);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/decline', declineCourse);
router.patch('/courses/:id/block', blockCourse);
router.patch('/courses/:id/unblock', unblockCourse);

// 4. Dashboard & Finances
router.get('/dashboard', getDashboardStats);
router.get('/payments', getPayments);
router.get('/payouts', getPayouts);
router.patch('/payouts/:id/status', updatePayoutStatus);

// 5. System Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// 6. Manual Enrollment Management
router.post('/enrollments/grant', grantEnrollment);
router.delete('/enrollments/:enrollmentId', revokeEnrollment);
router.get('/enrollments', getEnrollmentHistory);

export default router;

