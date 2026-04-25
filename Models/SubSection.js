



// import mongoose from "mongoose";

// const SubSectionSchema = new mongoose.Schema(
//   {
//     sectionType: {
//       type: String,
//       enum: ["one_to_one", "batch"],
//       required: true,
//     },

//     title: {
//       type: String,
//       required: true,
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

// export default mongoose.models.SubSection ||
//   mongoose.model("SubSection", SubSectionSchema);