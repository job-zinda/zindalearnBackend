import express from 'express';
const router = express.Router();
import { 
  getSettings, 
  getSubscription, 
  updateProfile, 
  updatePassword, 
  updatePreferences, 
  updateNotifications, 
  deleteAccount,
  sendVerificationEmail,
  verifyEmail,
  toggleWishlist
} from '../controllers/studentSettings.controller.js';
import { protect } from '../middleware/auth.js';

router.get('/', protect, getSettings);
router.get('/subscription', protect, getSubscription);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/preferences', protect, updatePreferences);
router.put('/notifications', protect, updateNotifications);
router.delete('/delete-account', protect, deleteAccount);
router.post('/send-verification-email', protect, sendVerificationEmail);
router.post('/verify-email/:token', verifyEmail); // Public — accessed from email link
router.post('/wishlist/toggle', protect, toggleWishlist);

export default router;

