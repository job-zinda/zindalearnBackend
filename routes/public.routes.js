import express from 'express';
const router = express.Router();
import {
  getLandingStats,
  getLandingTestimonials,
  getLandingCategories,
  getPublicSettings,
  getActiveBanners
} from '../controllers/public.controller.js';

router.get('/stats', getLandingStats);
router.get('/testimonials', getLandingTestimonials);
router.get('/categories', getLandingCategories);
router.get('/settings', getPublicSettings);
router.get('/banners', getActiveBanners);

export default router;
