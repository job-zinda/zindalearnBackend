import { paymentService } from '../services/payment.service.js';
import Order from '../models/Order.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { dispatchNotification } from '../services/notificationDispatcher.js';
import { normalizeReferralCode, validateReferralCode, calculateReferralCommission, creditOrderReferral } from '../services/referral.service.js';

export const verifyReferral = async (req, res) => {
  try {
    const code = normalizeReferralCode(req.body.referralCode);
    if (!code) return res.status(400).json({ success: false, message: 'Enter a Jobzinda referral ID' });
    await validateReferralCode(code);
    return res.json({ success: true, valid: true, referralCode: code });
  } catch (error) {
    console.error('Referral verification failed:', error.message);
    return res.status(error.status || 503).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const referralCode = normalizeReferralCode(req.body.referralCode);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.isBlocked || course.isDeleted || course.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This course is not available for purchase' });
    }

    const amount = course.discountPrice > 0 && course.discountPrice < course.price
      ? course.discountPrice
      : course.price;
    if (amount === 0) {
      return res.status(400).json({ success: false, message: 'This course is free. Use free enrollment instead.' });
    }
    const paymentMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'test'
      : process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'live' : null;
    if (!paymentMode) {
      return res.status(503).json({ success: false, message: 'Payment provider is not configured. Please contact support.' });
    }
    const referralCommissionPercent = referralCode ? course.referralCommissionPercent || 0 : 0;
    const referralCommissionAmount = calculateReferralCommission(amount, referralCommissionPercent);
    if (referralCode) await validateReferralCode(referralCode);
    const purchaser = await User.findById(userId).select('name');
    if (!purchaser?.name?.trim()) {
      return res.status(400).json({ success: false, message: 'Please add your name to your profile before purchasing' });
    }

    // 1. Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this course'
      });
    }

    // 2. Check if user already has a successful paid order
    const existingPaidOrder = await Order.findOne({
      user: userId,
      course: courseId,
      status: 'paid'
    });
    if (existingPaidOrder) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this course'
      });
    }

    // 3. Handle pending/created orders to avoid duplicate active payments and multiple rapid clicks
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingCreatedOrder = await Order.findOne({
      user: userId,
      course: courseId,
      status: 'created',
      amount,
      currency: course.currency || 'INR',
      referralCode,
      referralCommissionPercent,
      referralCommissionAmount,
      paymentMode,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingCreatedOrder) {
      return res.status(201).json({
        success: true,
        orderId: existingCreatedOrder.razorpayOrderId,
        amount: Math.round(existingCreatedOrder.amount * 100), // convert to paise
        currency: existingCreatedOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }

    // Create Razorpay Order
    const receipt = `rcpt_${Date.now()}_${courseId.substring(0, 5)}`;
    const razorpayOrder = await paymentService.createRazorpayOrder(
      amount,
      course.currency || 'INR',
      receipt
    );

    // Save Order in Database
    const order = new Order({
      user: userId,
      course: courseId,
      amount,
      currency: course.currency || 'INR',
      razorpayOrderId: razorpayOrder.id,
      status: 'created',
      referralCode,
      referralCommissionPercent,
      referralCommissionAmount,
      paymentMode,
      purchaserName: purchaser.name.trim(),
      courseName: course.title
    });

    await order.save();

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Failed to create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(value => typeof value === 'string' && value.length > 0 && value.length <= 200)) {
      return res.status(400).json({ success: false, message: 'Payment verification details are required' });
    }

    const isVerified = paymentService.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update Order in Database
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This payment belongs to another account' });
    }

    if (order.status !== 'paid') {
      const payment = await paymentService.getPayment(razorpay_payment_id);
      if (payment.status !== 'captured' || payment.order_id !== razorpay_order_id ||
          payment.amount !== Math.round(order.amount * 100) || payment.currency !== order.currency) {
        return res.status(400).json({ success: false, message: 'Payment has not been captured for this course order. Please retry verification or contact support.' });
      }
      order.status = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      if (order.referralCode && order.referralCommissionAmount > 0) {
        order.referralCreditStatus = 'pending';
        order.referralNextAttemptAt = new Date();
      }
      await order.save();
    }

    const enrollmentResult = await Enrollment.findOneAndUpdate({
      user: order.user,
      course: order.course
    }, { $setOnInsert: {
      user: order.user, course: order.course, paymentStatus: 'completed',
      paymentId: order.razorpayPaymentId, amountPaid: order.amount
    } }, { upsert: true, new: true, includeResultMetadata: true });
    const enrollment = enrollmentResult.value;

    if (!enrollmentResult.lastErrorObject.updatedExisting) await Promise.all([
      Course.findByIdAndUpdate(order.course, { 
        $inc: { totalStudents: 1 },
        $addToSet: { students: order.user }
      }),
      User.findByIdAndUpdate(order.user, { $addToSet: { enrolledCourses: order.course } })
    ]);
    await creditOrderReferral(order._id);
    const referralOrder = await Order.findById(order._id).select('referralCreditStatus');
    const referralCreditStatus = referralOrder.referralCreditStatus;

    // Trigger notification
    if (!enrollmentResult.lastErrorObject.updatedExisting) try {
      const course = await Course.findById(order.course);
      const studentUser = await User.findById(order.user).select('name');
      const studentName = studentUser ? studentUser.name : 'A student';

      // Notify student
      await dispatchNotification({
        userId: order.user,
        type: "courseEnrollments",
        title: "Course Enrolled 🎓",
        message: `Payment successful! You have been enrolled in "${course.title}".`,
        link: "/student/my-learning"
      });

      // Notify instructor
      if (course && course.instructor) {
        await dispatchNotification({
          userId: course.instructor,
          type: "courseEnrollments",
          title: "New Student Enrolled! 🎓",
          message: `${studentName} has enrolled in your course "${course.title}".`,
          link: "/instructor/students"
        });
      }
    } catch (notifErr) {
      console.error("Payment enrollment notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and enrollment successful',
      enrollment,
      referralCreditStatus
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
