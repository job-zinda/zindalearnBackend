import User from "../models/User.js";
import Course from "../models/Course.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";
import SystemSettings from "../models/SystemSettings.js";
import Banner from "../models/Banner.js";

export const getLandingStats = async (req, res) => {
  try {
    const [totalStudents, totalCourses, totalInstructors, reviews] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments({ status: "published", isBlocked: { $ne: true } }),
      User.countDocuments({ role: "instructor", isApproved: true }),
      Review.find()
    ]);

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "4.8";

    res.status(200).json({
      success: true,
      data: {
        students: totalStudents,
        courses: totalCourses,
        instructors: totalInstructors,
        avgRating
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandingTestimonials = async (req, res) => {
  try {
    const testimonials = await Review.find({ rating: { $gte: 4 } })
      .populate("user", "name role avatar profilePic")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandingCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $match: { status: "published", isBlocked: { $ne: true } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const categoryIcons = {
      'Web Development': '🌐',
      'Mobile Development': '📱',
      'Data Science': '📊',
      'Machine Learning': '🤖',
      'UI/UX Design': '🎨',
      'DevOps': '⚙️',
      'Cybersecurity': '🔒',
      'Cloud Computing': '☁️',
      'Business': '💼',
      'Marketing': '📈'
    };

    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      icon: categoryIcons[cat._id] || '📚'
    }));

    res.status(200).json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: settings.maintenanceMode,
        allowStudentRegistration: settings.allowStudentRegistration,
        allowInstructorApplications: settings.allowInstructorApplications,
        enablePublicCourseBrowsing: settings.enablePublicCourseBrowsing,
        enableGoogleLogin: settings.enableGoogleLogin,
        platformVersion: settings.platformVersion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

