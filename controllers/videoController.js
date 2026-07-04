import Video from "../models/Video.js";
import Course from "../models/Course.js";
import { cloudinaryService } from "../services/cloudinary.service.js";
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
      publicId 
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
      publicId
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

export const uploadVideo = async (req, res) => {
  try {
    const { courseId } = req.body;
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

    // 2. Upload to Cloudinary (folder will be determined by cloudinaryService based on courseId presence)
    const result = await cloudinaryService.uploadVideo(file.path, courseId);

    // 3. Delete temp file
    fs.unlinkSync(file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: Math.round(result.duration || 0)
    });

  } catch (error) {
    console.error("Backend Upload Error:", error);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};
