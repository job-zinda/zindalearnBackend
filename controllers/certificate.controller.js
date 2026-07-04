import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// @desc    Get student certificate stats
// @route   GET /api/student/certificates/stats
// @access  Private/Student
export const getCertificateStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const certificatesCount = await Certificate.countDocuments({ user: userId });
    const completedCoursesCount = await Enrollment.countDocuments({ user: userId, isCompleted: true });
    
    // Skills acquired (unique tags from all certificates)
    const certificates = await Certificate.find({ user: userId });
    const allSkills = certificates.reduce((acc, cert) => {
      return [...acc, ...cert.skills];
    }, []);
    const uniqueSkills = [...new Set(allSkills)];

    res.status(200).json({
      success: true,
      data: {
        certificatesEarned: certificatesCount,
        coursesCompleted: completedCoursesCount,
        skillsAcquired: uniqueSkills.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all certificates for a student
// @route   GET /api/student/certificates
// @access  Private/Student
export const getCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    const certificates = await Certificate.find({ user: userId })
      .populate({
        path: 'course',
        select: 'title thumbnail instructor category tags',
        populate: { path: 'instructor', select: 'name avatar' }
      })
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured certificate
// @route   GET /api/student/certificates/featured
// @access  Private/Student
export const getFeaturedCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    // For simplicity, we'll take the most recent one or the one with most tags
    const certificate = await Certificate.findOne({ user: userId })
      .populate({
        path: 'course',
        select: 'title thumbnail instructor category tags',
        populate: { path: 'instructor', select: 'name avatar' }
      })
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all skills acquired from certificates
// @route   GET /api/student/certificates/skills
// @access  Private/Student
export const getSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const certificates = await Certificate.find({ user: userId });
    
    const allSkills = certificates.reduce((acc, cert) => {
      return [...acc, ...cert.skills];
    }, []);
    const uniqueSkills = [...new Set(allSkills)];

    res.status(200).json({
      success: true,
      data: uniqueSkills
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
