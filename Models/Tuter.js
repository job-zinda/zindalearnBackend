
import mongoose from "mongoose";

const TuterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    email: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    qualification: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },

    subjects: [{ type: String, trim: true }],

    syllabus: {
      type: String,
      enum: ["state", "cbse", "icse", "none"],
      default: "none",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    sectionType: {
      type: String,
      enum: ["one_to_one", "batch", "none"],
      default: "none",
    },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tuter", TuterSchema);