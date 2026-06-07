

// import mongoose from "mongoose";

// const TuterSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     photo: { type: String, default: "" },
//     email: { type: String, default: "", trim: true },
//     phone: { type: String, required: true, trim: true },
//     qualification: { type: String, default: "", trim: true },
//     about: { type: String, default: "", trim: true },

//     subjects: [{ type: String, trim: true }],

//  syllabus: {
//   type: String,
//   default: "none",
//   trim: true,
// },

//     categoryId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     categoryIds: [
//   {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Category",
//   },
// ],

//     // old support keep cheyyanam
//     courseId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Course",
//       required: true,
//     },

//     // new multiple course support
//     courseIds: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Course",
//       },
//     ],

//     sectionType: {
//       type: String,
//       enum: ["one_to_one", "batch", "both", "none"],
//       default: "none",
//     },

//     isActive: { type: Boolean, default: true },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Tuter", TuterSchema);







































import mongoose from "mongoose";

const TuterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phone: { type: String, required: true, trim: true },
    qualification: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },

    subjects: [{ type: String, trim: true }],

    syllabus: {
      type: String,
      default: "none",
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    sectionType: {
      type: String,
      enum: ["one_to_one", "batch", "both", "none"],
      default: "none",
    },

    loginUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    loginPasswordText: {
      type: String,
      default: "",
    },

    isActive: { type: Boolean, default: true },




isBlocked: {
  type: Boolean,
  default: false,
},



    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);


TuterSchema.index({ createdAt: -1 });
TuterSchema.index({ categoryId: 1 });
TuterSchema.index({ courseId: 1 });
TuterSchema.index({ loginUserId: 1 });

export default mongoose.models.Tuter || mongoose.model("Tuter", TuterSchema);