import express from 'express';
import { 
  createLiveClass, 
  updateLiveClass, 
  deleteLiveClass, 
  startLiveClass, 
  endLiveClass, 
  getInstructorLiveClasses, 
  getStudentLiveClasses, 
  getLiveClassById, 
  joinLiveClass 
} from '../controllers/liveClass.controller.js';
import { protect, authorize } from '../../../middleware/auth.js';

const router = express.Router();

// Specific routes first
router.get('/instructor/all', protect, authorize('instructor'), getInstructorLiveClasses);
router.get('/student/all', protect, authorize('student'), getStudentLiveClasses);
router.get('/student', protect, getStudentLiveClasses);

// Parameterized routes last
router.get('/:id', protect, getLiveClassById);

// Instructor actions
router.post('/', protect, authorize('instructor'), createLiveClass);
router.put('/:id', protect, authorize('instructor'), updateLiveClass);
router.delete('/:id', protect, authorize('instructor'), deleteLiveClass);
router.patch('/:id/start', protect, authorize('instructor'), startLiveClass);
router.patch('/:id/end', protect, authorize('instructor'), endLiveClass);

// Student actions
router.post('/:id/join', protect, authorize('student'), joinLiveClass);

export default router;

