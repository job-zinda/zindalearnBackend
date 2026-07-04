import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { dispatchNotification } from '../services/notificationDispatcher.js';

// @desc    Get reviews for a course
// @route   GET /api/courses/:courseId/reviews
// @access  Public
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = { course: courseId };

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review
// @route   POST /api/courses/:courseId/reviews
// @access  Private (Student Only)
export const addReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating } = req.body;
    const reviewText = (req.body.review || req.body.comment || '').trim();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Validate review content
    if (!reviewText) {
      return res.status(400).json({ success: false, message: 'Review content is required and cannot be empty' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({ course: courseId, user: req.user.id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can review this course' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ course: courseId, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this course' });
    }

    const review = await Review.create({
      course: courseId,
      user: req.user.id,
      rating,
      review: reviewText,
      comment: reviewText
    });

    // Notify instructor
    if (course.instructor) {
      const studentName = req.user.name || 'A student';
      await dispatchNotification({
        userId: course.instructor,
        type: 'reviews',
        title: 'New Course Review! ⭐',
        message: `${studentName} left a ${rating}-star review on your course "${course.title}".`,
        link: '/instructor/reviews'
      });
    }

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    // Check for mongoose duplicate key error
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'You have already reviewed this course' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/courses/:courseId/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    const { rating } = req.body;
    const reviewText = (req.body.review || req.body.comment || '').trim();

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (req.body.review !== undefined || req.body.comment !== undefined) {
      if (!reviewText) {
        return res.status(400).json({ success: false, message: 'Review content is required and cannot be empty' });
      }
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (req.body.review !== undefined || req.body.comment !== undefined) {
      updateData.review = reviewText;
      updateData.comment = reviewText;
    }

    review = await Review.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/courses/:courseId/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a review
// @route   PUT /api/courses/:courseId/reviews/:id/reply
// @access  Private (Instructor/Admin Only)
export const replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (reply === undefined) {
      return res.status(400).json({ success: false, message: 'Reply field is required' });
    }

    const review = await Review.findById(req.params.id).populate('course');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if course exists and requester is the instructor of the course or admin
    if (review.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this review' });
    }

    review.reply = reply.trim();
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Reply updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Report a review
// @route   POST /api/courses/:courseId/reviews/:id/report
// @access  Private
export const reportReview = async (req, res) => {
  try {
    const { reportReason } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isReported = true;
    review.reportReason = (reportReason || '').trim() || 'No reason specified';
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
