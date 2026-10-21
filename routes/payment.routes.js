import express from 'express';
import { createOrder, verifyPayment, verifyReferral } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/verify-referral', protect, verifyReferral);

export default router;
