import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  paymentMode: { type: String, enum: ['test', 'live'] },
  referralCode: { type: String, default: '' },
  referralCommissionPercent: { type: Number, default: 0, min: 0, max: 100 },
  referralCommissionAmount: { type: Number, default: 0, min: 0 },
  purchaserName: { type: String, default: '' },
  courseName: { type: String, default: '' },
  referralCreditStatus: { type: String, enum: ['none', 'pending', 'processing', 'credited'], default: 'none' },
  referralNextAttemptAt: { type: Date },
  referralCreditError: { type: String, default: '' },
  referralCreditedAt: { type: Date }
}, { timestamps: true });
orderSchema.index({ status: 1, referralCreditStatus: 1, referralNextAttemptAt: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
