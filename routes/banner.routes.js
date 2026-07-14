import express from 'express';
const router = express.Router();
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners,
} from '../controllers/banner.controller.js';
import { protect, authorize } from '../middleware/auth.js';

router.use(protect, authorize('admin'));

router.get('/', getAllBanners);
router.post('/', createBanner);
router.patch('/reorder', reorderBanners);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/toggle-status', toggleBannerStatus);

export default router;
