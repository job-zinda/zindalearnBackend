import mongoose from "mongoose";

const StudentTutorAssignSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tutorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tuter",
      },
    ],

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("StudentTutorAssign", StudentTutorAssignSchema);