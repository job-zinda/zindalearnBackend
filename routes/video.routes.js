import express from 'express';
import { 
  getUploadSignature,
  saveVideoMetadata,
  deleteVideo, 
  getCourseVideos,
  uploadVideo
} from '../controllers/videoController.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.mp4' && ext !== '.webm' && ext !== '.mov') {
      return cb(new Error('Only MP4, WebM, and MOV videos are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

// All video routes require authentication
router.use(protect);

// Only instructors and admins can upload and manage metadata
router.post('/signature', authorize('instructor', 'admin'), getUploadSignature);
router.post('/upload', authorize('instructor', 'admin'), upload.single('video'), uploadVideo);
router.post('/', authorize('instructor', 'admin'), saveVideoMetadata);
router.delete('/:id', authorize('instructor', 'admin'), deleteVideo);

// Students can fetch videos for a course
router.get('/course/:courseId', getCourseVideos);

export default router;
