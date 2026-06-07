


// import mongoose from "mongoose";

// const UserSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },

//     pass: { type: String, required: true },

//     role: {
//       type: String,
//       enum: ["admin", "student"],
//       default: "student",
//     },

//     photo: {
//       type: String,
//       default: "",
//     },

//     phone: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     passwordChangedAt: { type: Date, default: null },

//     isActive: { type: Boolean, default: true },

//     invitedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     inviteTokenHash: {
//       type: String,
//       default: null,
//     },

//     inviteTokenExpires: {
//       type: Date,
//       default: null,
//     },

//     inviteAcceptedAt: {
//       type: Date,
//       default: null,
//     },

//     resetPasswordOtp: { type: String, default: null },
//     resetPasswordOtpExpires: { type: Date, default: null },
//     resetPasswordOtpVerified: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.User || mongoose.model("User", UserSchema);






















































import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    pass: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "student", "tutor"],
      default: "student",
    },

    photo: { type: String, default: "" },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    passwordChangedAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },

    isBlocked: {
  type: Boolean,
  default: false,
},

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    inviteTokenHash: { type: String, default: null },
    inviteTokenExpires: { type: Date, default: null },
    inviteAcceptedAt: { type: Date, default: null },

    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
    resetPasswordOtpVerified: { type: Boolean, default: false },

    
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, createdAt: -1 });
// UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);