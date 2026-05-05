import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = "uploads/chats";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `chat_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

const chatUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export default chatUpload;