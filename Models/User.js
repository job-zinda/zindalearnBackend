


// import mongoose from "mongoose";

// const UserSchema = new mongoose.Schema({
//   name: { type: String, required: true },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },

//   pass: { type: String, required: true },

//   syllabus: {
//     type: String,
//     enum: ["state", "cbse"],
//     required: true,
//   },

//   // ✅ ROLE ADD CHEYYU
//   role: {
//     type: String,
//     enum: ["admin", "student"],
//     default: "student", // 🔥 important
//   },

//   // security
//   passwordChangedAt: { type: Date, default: null },

//   isActive: { type: Boolean, default: true },
//   blockedAt: { type: Date, default: null },
//   blockedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null,
//   },

//   inviteTokenHash: { type: String, default: null },
//   inviteTokenExpires: { type: Date, default: null },


// resetPasswordOtp: { type: String, default: null },
// resetPasswordOtpExpires: { type: Date, default: null },
// resetPasswordOtpVerified: { type: Boolean, default: false },

// });

// export default mongoose.models.User || mongoose.model("User", UserSchema);

















































































import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  pass: { type: String, required: true },

  // syllabus: {
  //   type: String,
  //   enum: ["state", "cbse"],
  //   required: true,
  // },

  role: {
    type: String,
    enum: ["admin", "student"],
    default: "student",
  },

  photo: {
    type: String,
    default: "",
  },

  passwordChangedAt: { type: Date, default: null },

  isActive: { type: Boolean, default: true },
  // blockedAt: { type: Date, default: null },
  // blockedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   default: null,
  // },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  inviteTokenHash: {
    type: String,
    default: null,
  },
  inviteTokenExpires: {
    type: Date,
    default: null,
  },
  inviteAcceptedAt: {
    type: Date,
    default: null,
  },

  resetPasswordOtp: { type: String, default: null },
  resetPasswordOtpExpires: { type: Date, default: null },
  resetPasswordOtpVerified: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);