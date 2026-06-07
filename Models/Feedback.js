import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
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

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);


FeedbackSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.models.Feedback ||
  mongoose.model("Feedback", FeedbackSchema);