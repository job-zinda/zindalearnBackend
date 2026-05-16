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












































// import mongoose from "mongoose";

// const StudentTutorAssignSchema = new mongoose.Schema(
//   {
//     studentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     assignments: [
//       {
//         tutorId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Tuter",
//           required: true,
//         },

//         courseIds: [
//           {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Course",
//           },
//         ],
//       },
//     ],

//     assignedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("StudentTutorAssign", StudentTutorAssignSchema);