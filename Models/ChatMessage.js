
import mongoose from "mongoose";

const ChatFileSchema = new mongoose.Schema(
  {
    originalName: String,
    fileName: String,
    path: String,
    mimeType: String,
    size: Number,
    fileType: {
      type: String,
      enum: ["image", "video", "audio", "file"],
      default: "file",
    },
  },
  { _id: false }
);

const ConnectCardSchema = new mongoose.Schema(
  {
    tuterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tuter",
    },
    title: String,
    image: String,
    name: String,
    qualification: String,
    courseName: String,
    categoryName: String,
    syllabus: String,

    // admin only
    email: String,
    phone: String,
  },
  { _id: false }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "emoji", "file", "auto", "connect_card"],
      default: "text",
    },

    visibleFor: {
      type: String,
      enum: ["both", "student", "admin"],
      default: "both",
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    connectCard: ConnectCardSchema,

    files: [ChatFileSchema],

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);