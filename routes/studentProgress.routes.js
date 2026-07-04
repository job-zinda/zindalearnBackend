import express from 'express';
const router = express.Router();
import { 
  getOverview, 
  getCoursesProgress, 
  getAnalytics, 
  getActivity 
} from '../controllers/studentProgress.controller.js';
import { protect } from '../middleware/auth.js';

router.get('/overview', protect, getOverview);
router.get('/courses', protect, getCoursesProgress);
router.get('/analytics', protect, getAnalytics);
router.get('/activity', protect, getActivity);

export default router;
