import express from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Use absolute path for uploads directory — relative paths break when PM2
// starts the process from a different working directory on EC2
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure the uploads directory exists on startup
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', protect, upload.single('file'), uploadFile);

export default router;
