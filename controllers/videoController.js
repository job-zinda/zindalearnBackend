import Video from "../models/Video.js";
import Course from "../models/Course.js";
import { cloudinaryService } from "../services/cloudinary.service.js";
import { bunnyService } from "../services/bunny.service.js";
import fs from "fs";

export const getUploadSignature = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Missing courseId" });
    }

    // 1. Validate course exists and instructor ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Not authorized to upload to this course" });
    }

    // 2. Generate Cloudinary signature
    const signatureData = cloudinaryService.generateUploadSignature(courseId);

    res.status(200).json({
      success: true,
      ...signatureData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveVideoMetadata = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      videoUrl, 
      courseId, 
      source, 
      duration, 
      order,
      publicId,
      bunnyVideoId,
      hlsUrl
    } = req.body;

    // Validate course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl,
      source,
      duration,
      order,
      course: courseId,
      uploadedBy: req.user.id,
      publicId,
      bunnyVideoId,
      hlsUrl,
      transcodingStatus: source === 'bunny' ? 'processing' : '',
    });

    res.status(201).json({
      success: true,
      message: "Video metadata saved successfully",
      video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Delete from Cloudinary if source === 'upload'
    if (video.source === 'upload' && video.publicId) {
      await cloudinaryService.deleteVideo(video.publicId);
    }

    // Delete from Bunny.net if source === 'bunny'
    if (video.source === 'bunny' && video.bunnyVideoId) {
      try {
        await bunnyService.deleteVideo(video.bunnyVideoId);
      } catch (err) {
        console.error('Failed to delete from Bunny.net:', err.message);
        // Continue with DB deletion even if Bunny delete fails
      }
    }
    
    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseVideos = async (req, res) => {
  try {
    const videos = await Video.find({ course: req.params.courseId }).sort({ order: 1 });
    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload a video — routes to Bunny.net Stream (preferred) or Cloudinary
 * (legacy fallback when BUNNY_API_KEY is not configured).
 * 
 * The instructor's Flutter app hits this same endpoint; no client changes
 * required. The backend decides where to store the video.
 */
export const uploadVideo = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No video file provided" });
    }

    // 1. Validate course ownership if courseId is provided
    if (courseId && courseId !== 'undefined' && courseId !== 'null' && courseId !== '') {
      const course = await Course.findById(courseId);
      if (!course) {
        if (file.path) fs.unlinkSync(file.path);
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
        if (file.path) fs.unlinkSync(file.path);
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    // 2. Use Bunny.net Stream if configured, otherwise fall back to Cloudinary
    const useBunny = !!process.env.BUNNY_API_KEY;

    if (useBunny) {
      // Upload to Bunny.net Stream
      const videoTitle = title || file.originalname || 'Untitled Video';
      const result = await bunnyService.uploadVideo(file.path, videoTitle);

      // Delete temp file
      fs.unlinkSync(file.path);

      res.status(200).json({
        success: true,
        source: 'bunny',
        url: result.hlsUrl,
        bunnyVideoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
        status: result.status, // 'processing' — transcoding happens async
        duration: result.duration,
      });
    } else {
      // Legacy: Upload to Cloudinary
      const result = await cloudinaryService.uploadVideo(file.path, courseId);

      // Delete temp file
      fs.unlinkSync(file.path);

      res.status(200).json({
        success: true,
        source: 'upload',
        url: result.secure_url,
        publicId: result.public_id,
        duration: Math.round(result.duration || 0)
      });
    }
  } catch (error) {
    console.error("Backend Upload Error:", error);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate a secure, time-limited playback URL for a lesson video.
 * 
 * For Bunny.net videos: generates a token-signed HLS URL (expires in 6 hours).
 * For Cloudinary/YouTube videos: returns the existing URL as-is.
 * 
 * Route: GET /api/videos/playback/:courseId/:sectionId/:lessonId
 */
export const getPlaybackUrl = async (req, res) => {
  try {
    const { courseId, sectionId, lessonId } = req.params;

    // 1. Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // 2. Find the specific section and lesson
    const section = course.modules.id(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const lesson = section.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    // 3. Check access: enrolled students, instructors, or admins
    const userId = req.user.id;
    const isInstructor = course.instructor.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    const isEnrolled = course.students?.some(s => s.toString() === userId);
    const isFreeLesson = lesson.isFree;

    if (!isInstructor && !isAdmin && !isEnrolled && !isFreeLesson) {
      return res.status(403).json({ 
        success: false, 
        message: "Enroll in this course to access this lesson" 
      });
    }

    // 4. Generate playback URL based on source
    const source = lesson.source || '';
    const videoUrl = lesson.videoUrl || '';
    const bunnyVideoId = lesson.bunnyVideoId || '';

    if (source === 'bunny' && bunnyVideoId) {
      // Use direct HLS URL. CDN token auth should be OFF in the Bunny dashboard
      // for Stream libraries — Bunny Stream's managed pull zone doesn't support
      // directory-level tokens needed for HLS sub-playlist/segment auth.
      const playbackUrl = bunnyService.getDirectUrl(bunnyVideoId);
      
      return res.status(200).json({
        success: true,
        source: 'bunny',
        playbackUrl,
        expiresAt: null,
        isHls: true,
      });
    }

    // For Cloudinary/YouTube/other sources, return the URL directly
    return res.status(200).json({
      success: true,
      source: source || 'upload',
      playbackUrl: videoUrl,
      expiresAt: null,
      isHls: false,
    });

  } catch (error) {
    console.error("Playback URL Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check Bunny.net video transcoding status.
 * Useful for the instructor to see if a recently uploaded video is ready.
 * 
 * Route: GET /api/videos/status/:bunnyVideoId
 */
export const getVideoStatus = async (req, res) => {
  try {
    const { bunnyVideoId } = req.params;

    if (!process.env.BUNNY_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        message: "Bunny.net is not configured" 
      });
    }

    const status = await bunnyService.getVideoStatus(bunnyVideoId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
