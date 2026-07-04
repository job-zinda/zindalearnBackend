import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const paymentService = {
  /**
   * Create a new Razorpay order
   * @param {number} amount - Amount in paise (e.g., 500.00 -> 50000)
   * @param {string} currency - Currency code (default: INR)
   * @param {string} receipt - Unique receipt ID
   * @returns {Promise<Object>} Razorpay order
   */
  createRazorpayOrder: async (amount, currency = 'INR', receipt) => {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
      };
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw error;
    }
  },

  /**
   * Verify Razorpay payment signature
   * @param {string} razorpayOrderId
   * @param {string} razorpayPaymentId
   * @param {string} razorpaySignature
   * @returns {boolean}
   */
  verifySignature: (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    return expectedSignature === razorpaySignature;
  }
};
