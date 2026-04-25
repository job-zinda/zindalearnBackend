// import mongoose from "mongoose";

// const CategorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Category name is required"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     image: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     order: {
//       type: Number,
//       default: 0,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// const Category = mongoose.model("category", CategorySchema);
// export default Category;
























































// import mongoose from "mongoose";

// const CategorySchema = new mongoose.Schema(
//   {
//     key: {
//       type: String,
//       enum: ["online_tuition", "talent_base", "skill_base"],
//       required: true,
//       unique: true,
//       immutable: true,
//       trim: true,
//     },
//     title: {
//       type: String,
//       required: [true, "Category title is required"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     image: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     order: {
//       type: Number,
//       default: 0,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// const Category = mongoose.model("Category", CategorySchema);
// export default Category;

















































import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ["online_tuition", "talent_base", "skill_base"],
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Category title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;