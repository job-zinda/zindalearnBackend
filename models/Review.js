import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: [true, 'Please provide a review'],
    trim: true
  },
  comment: {
    type: String,
    trim: true
  },
  reply: {
    type: String,
    trim: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Auto map legacy comment into review on document load
reviewSchema.post('init', function(doc) {
  if (!doc.review && doc.comment) {
    doc.review = doc.comment;
  }
});

reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Static method to calculate average rating and update Course
reviewSchema.statics.calculateAverageRating = async function (courseId) {
  const obj = await this.aggregate([
    {
      $match: { course: courseId }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  try {
    const Course = mongoose.model('Course');
    if (obj.length > 0) {
      await Course.findByIdAndUpdate(courseId, {
        rating: Math.round(obj[0].averageRating * 10) / 10,
        totalRatings: obj[0].totalRatings
      });
    } else {
      await Course.findByIdAndUpdate(courseId, {
        rating: 0,
        totalRatings: 0
      });
    }
  } catch (error) {
    console.error('Error calculating average rating:', error);
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.course);
});

// Call calculateAverageRating before remove
reviewSchema.pre('remove', function (next) {
  this.constructor.calculateAverageRating(this.course);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.course);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
