import express from 'express';
const router = express.Router();
import { 
  getCertificateStats, 
  getCertificates, 
  getFeaturedCertificate, 
  getSkills 
} from '../controllers/certificate.controller.js';
import { protect } from '../middleware/auth.js';

router.get('/stats', protect, getCertificateStats);
router.get('/', protect, getCertificates);
router.get('/featured', protect, getFeaturedCertificate);
router.get('/skills', protect, getSkills);

export default router;
