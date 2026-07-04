import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [500, 'Minimum withdrawal amount is ₹500']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi'],
    required: true
  },
  paymentDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  adminComment: String,
  transactionId: String,
  paidAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}, { timestamps: true });

// Indexing for faster lookups
payoutSchema.index({ instructor: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

const Payout = mongoose.model('Payout', payoutSchema);
export default Payout;
