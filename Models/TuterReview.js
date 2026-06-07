import mongoose from "mongoose";

const TuterReviewSchema = new mongoose.Schema(
  {
    tuterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tuter",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

TuterReviewSchema.index({ tuterId: 1, studentId: 1 }, { unique: true });


export default mongoose.model("TuterReview", TuterReviewSchema);