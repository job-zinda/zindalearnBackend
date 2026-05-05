
import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ChatRoomSchema.index(
  { studentId: 1, adminId: 1 },
  { unique: true }
);

export default mongoose.model("ChatRoom", ChatRoomSchema);