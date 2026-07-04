import { paymentService } from '../services/payment.service.js';
import Order from '../models/Order.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { dispatchNotification } from '../services/notificationDispatcher.js';

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.isBlocked) {
      return res.status(400).json({ success: false, message: 'This course has been suspended' });
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

    // Delete older created orders for this user + course to keep DB clean
    await Order.deleteMany({
      user: userId,
      course: courseId,
      status: 'created'
    });

    // Create Razorpay Order
    const receipt = `rcpt_${Date.now()}_${courseId.substring(0, 5)}`;
    const razorpayOrder = await paymentService.createRazorpayOrder(
      course.price,
      course.currency || 'INR',
      receipt
    );

    // Save Order in Database
    const order = new Order({
      user: userId,
      course: courseId,
      amount: course.price,
      currency: course.currency || 'INR',
      razorpayOrderId: razorpayOrder.id,
      status: 'created'
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
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    // Prevent duplicate processing if order is already marked as paid
    if (order.status === 'paid') {
      const existingEnrollment = await Enrollment.findOne({
        user: order.user,
        course: order.course
      });
      return res.status(200).json({
        success: true,
        message: 'Payment verified and enrollment successful',
        enrollment: existingEnrollment
      });
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // Check if enrollment already exists to avoid duplicate entries
    const existingEnrollment = await Enrollment.findOne({
      user: order.user,
      course: order.course
    });

    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified and enrollment successful',
        enrollment: existingEnrollment
      });
    }

    // Create Enrollment
    const enrollment = new Enrollment({
      user: order.user,
      course: order.course,
      paymentStatus: 'completed',
      paymentId: razorpay_payment_id,
      amountPaid: order.amount,
      enrolledAt: new Date()
    });
    await enrollment.save();

    // Update Course and User
    await Promise.all([
      Course.findByIdAndUpdate(order.course, { 
        $inc: { totalStudents: 1 },
        $addToSet: { students: order.user }
      }),
      User.findByIdAndUpdate(order.user, { $addToSet: { enrolledCourses: order.course } })
    ]);

    // Trigger notification
    try {
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
      enrollment
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
