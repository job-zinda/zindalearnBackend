



// import mongoose from "mongoose";

// const SubSectionItemSchema = new mongoose.Schema(
//   {
//     subSectionId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SubSection",
//       required: true,
//     },

//     image: {
//       type: String,
//       default: "",
//     },

//     className: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       default: "",
//       trim: true,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.SubSectionItem ||
//   mongoose.model("SubSectionItem", SubSectionItemSchema);