import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserSchema from "./Models/User.js";
import jwt from "jsonwebtoken";
import sendOtpMail from "./Models/Otp.js";
import BannerSchema from "./Models/Banner.js";
import fs from "fs";
import CategorySchema from "./Models/Category.js";
import CourseSchema from "./Models/Course.js";
import TuterSchema from "./Models/Tuter.js";
import TuterReviewSchema from "./Models/TuterReview.js";
import sendStudentInviteMail from "./utils/sendStudentInviteMail.js";

import ChatRoomSchema from "./Models/ChatRoom.js";
import ChatMessageSchema from "./Models/ChatMessage.js";
import { getIO, isUserOnline } from "./socket.js";

import FeedbackSchema from "./Models/Feedback.js";







export function makeOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}




export async function REGISTER(req, res) {
  try {
    const { name, email, phone, pass, cpass } = req.body;

    if (!name || !email || !phone || !pass || !cpass) {
      return res.status(400).json({
        msg: "name, email, phone, pass, cpass are required",
      });
    }

    if (pass !== cpass) {
      return res.status(400).json({ msg: "Password mismatch" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = String(phone).trim();

    const existing = await UserSchema.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existing) {
      return res.status(409).json({
        msg:
          existing.email === cleanEmail
            ? "User already exists, please login"
            : "Phone number already exists",
      });
    }

    const hashed = await bcrypt.hash(pass, 10);

    const user = await UserSchema.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      pass: hashed,
    });

    return res.status(201).json({
      msg: "Registration successful",
      userId: user._id,
    });
  } catch (err) {
    console.log("REGISTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}











export async function LOGIN(req, res) {
  try {
    const { email, phone, pass } = req.body;

    // validation
    if ((!email && !phone) || !pass) {
      return res.status(400).json({
        msg: "Email or phone and password are required",
      });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanPhone = phone ? String(phone).trim() : null;

    // find user by email OR phone
    const user = await UserSchema.findOne({
      $or: [
        cleanEmail ? { email: cleanEmail } : null,
        cleanPhone ? { phone: cleanPhone } : null,
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // check blocked
    if (user.isActive === false) {
      return res.status(403).json({
        msg: "Account blocked by admin",
      });
    }

    // check password
    const success = await bcrypt.compare(pass, user.pass);

    if (!success) {
      return res.status(401).json({
        msg: "Incorrect password",
      });
    }

    // generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        syllabus: user.syllabus,
        role: user.role,
      },
      process.env.JWT_TOKEN,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        syllabus: user.syllabus,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("LOGIN error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}




//admin change password

export async function CHANGE_PASSWORD(req, res) {
  try {
    const { oldPass, newPass, confirmPass } = req.body;

    if (!oldPass || !newPass || !confirmPass) {
      return res.status(400).json({
        msg: "oldPass, newPass and confirmPass are required",
      });
    }

    if (newPass !== confirmPass) {
      return res.status(400).json({
        msg: "New password and confirm password do not match",
      });
    }

    const user = await UserSchema.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPass, user.pass);

    if (!isMatch) {
      return res.status(401).json({
        msg: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(newPass, user.pass);

    if (samePassword) {
      return res.status(400).json({
        msg: "New password must be different from current password",
      });
    }

    user.pass = await bcrypt.hash(newPass, 10);
    user.passwordChangedAt = new Date();

    await user.save();

    return res.status(200).json({
      msg: "Password changed successfully",
    });
  } catch (err) {
    console.log("CHANGE_PASSWORD error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}




//forgot password



export async function FORGOT_PASSWORD_SEND_OTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const otp = makeOtp();

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 5 * 60 * 1000; // 5 min
    user.resetPasswordOtpVerified = false;

    await user.save();

    await sendOtpMail(email, otp);

    return res.status(200).json({ msg: "OTP sent to email" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}











export async function FORGOT_PASSWORD_VERIFY_OTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP required" });
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (
      user.resetPasswordOtp !== otp ||
      user.resetPasswordOtpExpires < Date.now()
    ) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.resetPasswordOtpVerified = true;
    await user.save();

    return res.status(200).json({ msg: "OTP verified" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}










//reset password

export async function RESET_PASSWORD(req, res) {
  try {
    const { email, newpass, confirmpass } = req.body;

    if (!email || !newpass || !confirmpass) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (newpass !== confirmpass) {
      return res.status(400).json({ msg: "Password mismatch" });
    }

    const user = await UserSchema.findOne({ email });

    if (!user || !user.resetPasswordOtpVerified) {
      return res.status(403).json({ msg: "OTP not verified" });
    }

    const hashed = await bcrypt.hash(newpass, 10);

    user.pass = hashed;
    user.passwordChangedAt = new Date();

    // clear OTP
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpVerified = false;

    await user.save();

    return res.status(200).json({ msg: "Password reset successful" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}







//upload photo

// ✅ upload profile photo by logged-in user
export async function UPLOAD_PROFILE_PHOTO(req, res) {
  try {
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ msg: "Photo is required" });
    }

    const updatedUser = await UserSchema.findByIdAndUpdate(
      req.user._id,
      { photo },
      { new: true }
    ).select("-pass");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json({
      msg: "Profile photo uploaded successfully",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}







//get my profile

// ✅ get logged-in user's profile
export async function GET_MY_PROFILE(req, res) {
  try {
    const user = await UserSchema.findById(req.user._id).select("-pass");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json({
      msg: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

















export async function UPDATE_MY_PROFILE(req, res) {
  try {
    const { name, email, phone, syllabus, photo } = req.body;

    const user = await UserSchema.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (email && email !== user.email) {
      const cleanEmail = email.toLowerCase().trim();

      const existingUser = await UserSchema.findOne({
        email: cleanEmail,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(409).json({ msg: "Email already in use" });
      }

      user.email = cleanEmail;
    }

    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();

      if (cleanPhone) {
        const existingPhone = await UserSchema.findOne({
          phone: cleanPhone,
          _id: { $ne: req.user._id },
        });

        if (existingPhone) {
          return res.status(409).json({ msg: "Phone number already in use" });
        }
      }

      user.phone = cleanPhone;
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (syllabus) {
      const allowedSyllabus = ["state", "cbse", "icse"];

      if (!allowedSyllabus.includes(syllabus.toLowerCase())) {
        return res.status(400).json({
          msg: "Invalid syllabus. Choose state, cbse or icse",
        });
      }

      user.syllabus = syllabus.toLowerCase();
    }

    if (photo !== undefined) {
      user.photo = photo;
    }

    await user.save();

    return res.status(200).json({
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.log("UPDATE_MY_PROFILE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}




















export async function DELETE_MY_ACCOUNT(req, res) {
  try {
    const user = await UserSchema.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await FeedbackSchema.deleteMany({ studentId: req.user._id });
    await TuterReviewSchema.deleteMany({ studentId: req.user._id });
    await ChatMessageSchema.deleteMany({ senderId: req.user._id });
    await ChatRoomSchema.deleteMany({
      $or: [{ studentId: req.user._id }, { adminId: req.user._id }],
    });

    await UserSchema.findByIdAndDelete(req.user._id);

    return res.status(200).json({
      msg: "Account deleted successfully",
    });
  } catch (err) {
    console.log("DELETE_MY_ACCOUNT error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






//adding banner

// ===================== BANNER =====================

// admin create banner with image upload
export async function CREATE_BANNER(req, res) {
  try {
    const { title, isActive, order } = req.body;

    if (!req.file) {
      return res.status(400).json({
        msg: "Banner image file is required",
      });
    }

    const banner = await BannerSchema.create({
      title: title ? title.trim() : "",
      image: req.file.path.replace(/\\/g, "/"),
      isActive: isActive !== undefined ? isActive : true,
      order: order !== undefined ? Number(order) : 0,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      msg: "Banner created successfully",
      banner,
    });
  } catch (err) {
    console.log("CREATE_BANNER error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}





// get active banners for frontend
export async function GET_ACTIVE_BANNERS(req, res) {
  try {
    const banners = await BannerSchema.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      msg: "Active banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (err) {
    console.log("GET_ACTIVE_BANNERS error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}

// admin get all banners
export async function GET_ALL_BANNERS_ADMIN(req, res) {
  try {
    const banners = await BannerSchema.find()
      .populate("createdBy", "name email role")
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
      msg: "All banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (err) {
    console.log("GET_ALL_BANNERS_ADMIN error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}

// admin delete banner
export async function DELETE_BANNER(req, res) {
  try {
    const { bannerId } = req.params;

    const banner = await BannerSchema.findById(bannerId);

    if (!banner) {
      return res.status(404).json({
        msg: "Banner not found",
      });
    }

    // uploaded image file delete ചെയ്യാം
    if (banner.image && fs.existsSync(banner.image)) {
      fs.unlinkSync(banner.image);
    }

    await BannerSchema.findByIdAndDelete(bannerId);

    return res.status(200).json({
      msg: "Banner deleted successfully",
    });
  } catch (err) {
    console.log("DELETE_BANNER error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}

// admin update banner image / active / order
export async function UPDATE_BANNER(req, res) {
  try {
    const { bannerId } = req.params;
    const { title, isActive, order } = req.body;

    const banner = await BannerSchema.findById(bannerId);

    if (!banner) {
      return res.status(404).json({
        msg: "Banner not found",
      });
    }

    if (title !== undefined) {
      banner.title = title.trim();
    }

    if (isActive !== undefined) {
      banner.isActive = isActive;
    }

    if (order !== undefined) {
      banner.order = Number(order);
    }

    if (req.file) {
      if (banner.image && fs.existsSync(banner.image)) {
        fs.unlinkSync(banner.image);
      }

      banner.image = req.file.path.replace(/\\/g, "/");
    }

    await banner.save();

    return res.status(200).json({
      msg: "Banner updated successfully",
      banner,
    });
  } catch (err) {
    console.log("UPDATE_BANNER error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}
























// ===================== CATEGORY SECTION =====================

// admin get all fixed categories
export async function GET_ALL_CATEGORIES_ADMIN(req, res) {
  try {
    const categories = await CategorySchema.find()
      .populate("createdBy", "name email role")
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      msg: "All categories fetched successfully",
      count: categories.length,
      categories,
    });
  } catch (err) {
    console.log("GET_ALL_CATEGORIES_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// user get active categories
export async function GET_ACTIVE_CATEGORIES(req, res) {
  try {
    const categories = await CategorySchema.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("-__v");

    return res.status(200).json({
      msg: "Active categories fetched successfully",
      count: categories.length,
      categories,
    });
  } catch (err) {
    console.log("GET_ACTIVE_CATEGORIES error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// get single category
export async function GET_SINGLE_CATEGORY(req, res) {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: "Invalid category id" });
    }

    const category = await CategorySchema.findById(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    return res.status(200).json({
      msg: "Category fetched successfully",
      category,
    });
  } catch (err) {
    console.log("GET_SINGLE_CATEGORY error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// admin update category
export async function UPDATE_CATEGORY(req, res) {
  try {
    const { categoryId } = req.params;
    const { title, description, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: "Invalid category id" });
    }

    const category = await CategorySchema.findById(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    if (title !== undefined) {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        return res.status(400).json({
          msg: "Category title cannot be empty",
        });
      }

      category.title = trimmedTitle;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (isActive !== undefined) {
      category.isActive = isActive === "true" || isActive === true;
    }

    if (order !== undefined) {
      category.order = Number(order);
    }

    if (req.file) {
      if (category.image && fs.existsSync(category.image)) {
        fs.unlinkSync(category.image);
      }

      category.image = req.file.path.replace(/\\/g, "/");
    }

    await category.save();

    return res.status(200).json({
      msg: "Category updated successfully",
      category,
    });
  } catch (err) {
    console.log("UPDATE_CATEGORY error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}














// ===================== COURSE SECTION =====================

// admin create course
export async function CREATE_COURSE(req, res) {
  try {
    const { categoryId, name, description, sectionType, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        msg: "Valid categoryId is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        msg: "Course name is required",
      });
    }

    const category = await CategorySchema.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        msg: "Category not found",
      });
    }

    const existingCourse = await CourseSchema.findOne({
      categoryId,
      name: name.trim(),
    });

    if (existingCourse) {
      return res.status(409).json({
        msg: "Course already exists in this category",
      });
    }

    let finalSectionType = "none";

    if (category.key === "online_tuition") {
      if (!sectionType || !["one_to_one", "batch"].includes(sectionType)) {
        return res.status(400).json({
          msg: "For Online Tuition, sectionType must be one_to_one or batch",
        });
      }
      finalSectionType = sectionType;
    }

    if (category.key !== "online_tuition") {
      finalSectionType = "none";
    }

    const course = await CourseSchema.create({
      categoryId,
      name: name.trim(),
      description: description ? description.trim() : "",
      image: req.file ? req.file.path.replace(/\\/g, "/") : "",
      sectionType: finalSectionType,
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
      order: order !== undefined ? Number(order) : 0,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      msg: "Course created successfully",
      course,
    });
  } catch (err) {
    console.log("CREATE_COURSE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// admin get all courses
export async function GET_ALL_COURSES_ADMIN(req, res) {
  try {
    const courses = await CourseSchema.find()
      .populate("categoryId", "key title description image")
      .populate("createdBy", "name email role")
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
      msg: "All courses fetched successfully",
      count: courses.length,
      courses,
    });
  } catch (err) {
    console.log("GET_ALL_COURSES_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// get courses by category
export async function GET_COURSES_BY_CATEGORY(req, res) {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: "Invalid category id" });
    }

    const category = await CategorySchema.findById(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const courses = await CourseSchema.find({
      categoryId,
      isActive: true,
    }).sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
      msg: "Courses fetched successfully",
      category: {
        _id: category._id,
        key: category.key,
        title: category.title,
        description: category.description,
        image: category.image,
      },
      count: courses.length,
      courses,
    });
  } catch (err) {
    console.log("GET_COURSES_BY_CATEGORY error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// get single course
export async function GET_SINGLE_COURSE(req, res) {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid course id" });
    }

    const course = await CourseSchema.findById(courseId)
      .populate("categoryId", "key title description image")
      .populate("createdBy", "name email role");

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    return res.status(200).json({
      msg: "Course fetched successfully",
      course,
    });
  } catch (err) {
    console.log("GET_SINGLE_COURSE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// admin update course
export async function UPDATE_COURSE(req, res) {
  try {
    const { courseId } = req.params;
    const { name, description, sectionType, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid course id" });
    }

    const course = await CourseSchema.findById(courseId);

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    const category = await CategorySchema.findById(course.categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          msg: "Course name cannot be empty",
        });
      }

      const existingCourse = await CourseSchema.findOne({
        categoryId: course.categoryId,
        name: trimmedName,
        _id: { $ne: courseId },
      });

      if (existingCourse) {
        return res.status(409).json({
          msg: "Course already exists in this category",
        });
      }

      course.name = trimmedName;
    }

    if (description !== undefined) {
      course.description = description.trim();
    }

    if (category.key === "online_tuition") {
      if (sectionType !== undefined) {
        if (!["one_to_one", "batch"].includes(sectionType)) {
          return res.status(400).json({
            msg: "sectionType must be one_to_one or batch",
          });
        }
        course.sectionType = sectionType;
      }
    } else {
      course.sectionType = "none";
    }

    if (isActive !== undefined) {
      course.isActive = isActive === "true" || isActive === true;
    }

    if (order !== undefined) {
      course.order = Number(order);
    }

    if (req.file) {
      if (course.image && fs.existsSync(course.image)) {
        fs.unlinkSync(course.image);
      }

      course.image = req.file.path.replace(/\\/g, "/");
    }

    await course.save();

    return res.status(200).json({
      msg: "Course updated successfully",
      course,
    });
  } catch (err) {
    console.log("UPDATE_COURSE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// admin delete course
export async function DELETE_COURSE(req, res) {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid course id" });
    }

    const course = await CourseSchema.findById(courseId);

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    if (course.image && fs.existsSync(course.image)) {
      fs.unlinkSync(course.image);
    }

    await CourseSchema.findByIdAndDelete(courseId);

    return res.status(200).json({
      msg: "Course deleted successfully",
      deletedCourse: course,
    });
  } catch (err) {
    console.log("DELETE_COURSE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}















//tuter section



// ===================== TUTER MANAGEMENT =====================

function parseSubjects(subjects) {
  if (!subjects) return [];

  if (Array.isArray(subjects)) {
    return subjects.map((s) => String(s).trim()).filter(Boolean);
  }

  return String(subjects)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}










async function getTuterRatingSummary(tuterId) {
  const result = await TuterReviewSchema.aggregate([
    {
      $match: {
        tuterId: new mongoose.Types.ObjectId(tuterId),
      },
    },
    {
      $group: {
        _id: "$tuterId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }

  return {
    averageRating: Number(result[0].averageRating.toFixed(1)),
    totalReviews: result[0].totalReviews,
  };
}

async function attachRatingAndReviews(tuter) {
  const plainTuter = tuter.toObject ? tuter.toObject() : tuter;

  const ratingSummary = await getTuterRatingSummary(plainTuter._id);

  const reviews = await TuterReviewSchema.find({
    tuterId: plainTuter._id,
  })
    .populate("studentId", "name email photo")
    .sort({ createdAt: -1 });

  return {
    ...plainTuter,
    averageRating: ratingSummary.averageRating,
    totalReviews: ratingSummary.totalReviews,
    reviews,
  };
}




















export async function CREATE_TUTER(req, res) {
  try {
    const {
      name,
      email,
      phone,
      qualification,
      about,
      subjects,
      categoryId,
      courseId,
      sectionType,
      syllabus,
      isActive,
    } = req.body;

    if (!name || !phone || !categoryId || !courseId) {
      return res.status(400).json({
        msg: "name, phone, categoryId and courseId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: "Invalid categoryId" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid courseId" });
    }

    const category = await CategorySchema.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const course = await CourseSchema.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    if (String(course.categoryId) !== String(categoryId)) {
      return res.status(400).json({
        msg: "Selected course does not belong to selected category",
      });
    }

    let finalSectionType = "none";
    let finalSyllabus = "none";

    if (category.key === "online_tuition") {
      if (!sectionType || !["one_to_one", "batch"].includes(sectionType)) {
        return res.status(400).json({
          msg: "For Online Tuition, sectionType must be one_to_one or batch",
        });
      }

      if (course.sectionType !== sectionType) {
        return res.status(400).json({
          msg: "Selected course does not belong to selected section",
        });
      }

      if (!syllabus || !["state", "cbse", "icse"].includes(syllabus)) {
        return res.status(400).json({
          msg: "For Online Tuition, syllabus must be state, cbse or icse",
        });
      }

      finalSectionType = sectionType;
      finalSyllabus = syllabus;
    }

    const tuter = await TuterSchema.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : "",
      phone: phone.trim(),
      qualification: qualification ? qualification.trim() : "",
      about: about ? about.trim() : "",
      subjects: parseSubjects(subjects),
      categoryId,
      courseId,
      sectionType: finalSectionType,
      syllabus: finalSyllabus,
      photo: req.file ? req.file.path.replace(/\\/g, "/") : "",
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      msg: "Tuter created successfully",
      tuter,
    });
  } catch (err) {
    console.log("CREATE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
















// admin get all tuters
export async function GET_ALL_TUTERS_ADMIN(req, res) {
  try {
    const tuters = await TuterSchema.find()
      .populate("categoryId", "key title image")
      .populate("courseId", "name description image sectionType")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      tuters.map((tuter) => attachRatingAndReviews(tuter))
    );

    return res.status(200).json({
      msg: "All tuters fetched successfully",
      count: data.length,
      tuters: data,
    });
  } catch (err) {
    console.log("GET_ALL_TUTERS_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}










// user/admin get tuters by course
export async function GET_TUTERS_BY_COURSE(req, res) {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid courseId" });
    }

    const tuters = await TuterSchema.find({
      courseId,
      isActive: true,
    })
      .populate("categoryId", "key title image")
      .populate("courseId", "name description image sectionType")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      tuters.map((tuter) => attachRatingAndReviews(tuter))
    );

    return res.status(200).json({
      msg: "Tutors fetched successfully",
      count: data.length,
      tuters: data,
    });
  } catch (err) {
    console.log("GET_TUTERS_BY_COURSE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}












// user/admin get single tuter
export async function GET_SINGLE_TUTER(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const tuter = await TuterSchema.findById(tuterId)
      .populate("categoryId", "key title image")
      .populate("courseId", "name description image sectionType")
      .populate("createdBy", "name email role");

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    const data = await attachRatingAndReviews(tuter);

    return res.status(200).json({
      msg: "Tuter fetched successfully",
      tuter: data,
    });
  } catch (err) {
    console.log("GET_SINGLE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}








export async function UPDATE_TUTER(req, res) {
  try {
    const { tuterId } = req.params;

    const {
      name,
      email,
      phone,
      qualification,
      about,
      subjects,
      categoryId,
      courseId,
      sectionType,
      syllabus,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const tuter = await TuterSchema.findById(tuterId);
    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    const finalCategoryId = categoryId || tuter.categoryId;
    const finalCourseId = courseId || tuter.courseId;

    if (!mongoose.Types.ObjectId.isValid(finalCategoryId)) {
      return res.status(400).json({ msg: "Invalid categoryId" });
    }

    if (!mongoose.Types.ObjectId.isValid(finalCourseId)) {
      return res.status(400).json({ msg: "Invalid courseId" });
    }

    const category = await CategorySchema.findById(finalCategoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const course = await CourseSchema.findById(finalCourseId);
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    if (String(course.categoryId) !== String(finalCategoryId)) {
      return res.status(400).json({
        msg: "Selected course does not belong to selected category",
      });
    }

    let finalSectionType = "none";
    let finalSyllabus = "none";

    if (category.key === "online_tuition") {
      const selectedSection = sectionType || tuter.sectionType;

      if (!selectedSection || !["one_to_one", "batch"].includes(selectedSection)) {
        return res.status(400).json({
          msg: "For Online Tuition, sectionType must be one_to_one or batch",
        });
      }

      if (course.sectionType !== selectedSection) {
        return res.status(400).json({
          msg: "Selected course does not belong to selected section",
        });
      }

      const selectedSyllabus = syllabus || tuter.syllabus;

      if (!selectedSyllabus || !["state", "cbse", "icse"].includes(selectedSyllabus)) {
        return res.status(400).json({
          msg: "For Online Tuition, syllabus must be state, cbse or icse",
        });
      }

      finalSectionType = selectedSection;
      finalSyllabus = selectedSyllabus;
    }

    if (name !== undefined) tuter.name = name.trim();
    if (email !== undefined) tuter.email = email.trim().toLowerCase();
    if (phone !== undefined) tuter.phone = phone.trim();
    if (qualification !== undefined) tuter.qualification = qualification.trim();
    if (about !== undefined) tuter.about = about.trim();
    if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

    tuter.categoryId = finalCategoryId;
    tuter.courseId = finalCourseId;
    tuter.sectionType = finalSectionType;
    tuter.syllabus = finalSyllabus;

    if (isActive !== undefined) {
      tuter.isActive = isActive === "true" || isActive === true;
    }

    if (req.file) {
      if (tuter.photo && fs.existsSync(tuter.photo)) {
        fs.unlinkSync(tuter.photo);
      }

      tuter.photo = req.file.path.replace(/\\/g, "/");
    }

    await tuter.save();

    return res.status(200).json({
      msg: "Tuter updated successfully",
      tuter,
    });
  } catch (err) {
    console.log("UPDATE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

















// admin delete tuter
export async function DELETE_TUTER(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const tuter = await TuterSchema.findById(tuterId);

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    if (tuter.photo && fs.existsSync(tuter.photo)) {
      fs.unlinkSync(tuter.photo);
    }

    await TuterReviewSchema.deleteMany({ tuterId });
    await TuterSchema.findByIdAndDelete(tuterId);

    return res.status(200).json({
      msg: "Tuter deleted successfully",
      deletedTuter: tuter,
    });
  } catch (err) {
    console.log("DELETE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}














// student add/update review
export async function ADD_TUTER_REVIEW(req, res) {
  try {
    const { tuterId } = req.params;
    const { rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        msg: "Rating must be between 1 and 5",
      });
    }

    if (!review || !review.trim()) {
      return res.status(400).json({
        msg: "Review is required",
      });
    }

    const tuter = await TuterSchema.findById(tuterId);

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    const savedReview = await TuterReviewSchema.findOneAndUpdate(
      {
        tuterId,
        studentId: req.user._id,
      },
      {
        rating: Number(rating),
        review: review.trim(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate("studentId", "name email photo");

    const ratingSummary = await getTuterRatingSummary(tuterId);

    return res.status(200).json({
      msg: "Review saved successfully",
      review: savedReview,
      averageRating: ratingSummary.averageRating,
      totalReviews: ratingSummary.totalReviews,
    });
  } catch (err) {
    console.log("ADD_TUTER_REVIEW error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}











// student get all active tuters
export async function GET_ALL_TUTERS_USER(req, res) {
  try {
    const tuters = await TuterSchema.find({ isActive: true })
      .populate("categoryId", "key title image")
      .populate("courseId", "name description image sectionType")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      tuters.map((tuter) => attachRatingAndReviews(tuter))
    );

    return res.status(200).json({
      msg: "All active tutors fetched successfully",
      count: data.length,
      tuters: data,
    });
  } catch (err) {
    console.log("GET_ALL_TUTERS_USER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}












// student get tuters by category
export async function GET_TUTERS_BY_CATEGORY(req, res) {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: "Invalid categoryId" });
    }

    const category = await CategorySchema.findById(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const tuters = await TuterSchema.find({
      categoryId,
      isActive: true,
    })
      .populate("categoryId", "key title image")
      .populate("courseId", "name description image sectionType")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      tuters.map((tuter) => attachRatingAndReviews(tuter))
    );

    return res.status(200).json({
      msg: "Tutors fetched by category successfully",
      category,
      count: data.length,
      tuters: data,
    });
  } catch (err) {
    console.log("GET_TUTERS_BY_CATEGORY error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}





//student management
// student management - get all students only
export async function GET_ALL_STUDENTS_ADMIN(req, res) {
  try {
    const users = await UserSchema.find({ role: "student" })
      .select("-pass")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      msg: "All students fetched successfully",
      count: users.length,
      students: users,
    });
  } catch (err) {
    console.log("GET_ALL_USERS_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}








export async function GET_SINGLE_STUDENT_ADMIN(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid userId" });
    }

    const user = await UserSchema.findOne({
      _id: userId,
      role: "student",
    }).select("-pass");

    if (!user) {
      return res.status(404).json({ msg: "Student not found" });
    }

    return res.status(200).json({
      msg: "Student fetched successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}














export async function UPDATE_STUDENT_ADMIN(req, res) {
  try {
    const { userId } = req.params;
    const { name, email, phone, photo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid userId" });
    }

    const user = await UserSchema.findOne({
      _id: userId,
      role: "student",
    });

    if (!user) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // ✅ EMAIL DUPLICATE CHECK
    if (email && email !== user.email) {
      const existing = await UserSchema.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      });

      if (existing) {
        return res.status(409).json({ msg: "Email already exists" });
      }

      user.email = email.toLowerCase().trim();
    }

    // ✅ UPDATE FIELDS
    if (name !== undefined) user.name = name.trim();

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (photo !== undefined) {
      user.photo = photo;
    }

    await user.save();

    return res.status(200).json({
      msg: "Student updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone, // ✅ RETURN ALSO
        photo: user.photo,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("UPDATE_STUDENT_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}














export async function DELETE_STUDENT_ADMIN(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid userId" });
    }

    const user = await UserSchema.findOne({
      _id: userId,
      role: "student",
    });

    if (!user) {
      return res.status(404).json({ msg: "Student not found" });
    }

    await UserSchema.findByIdAndDelete(userId);

    return res.status(200).json({
      msg: "Student deleted successfully",
      deletedUser: user,
    });
  } catch (err) {
    console.log("DELETE_USER_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}




















































// admin active / deactive tuter
export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
  try {
    const { tuterId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        msg: "isActive is required. Send true or false",
      });
    }

    const tuter = await TuterSchema.findById(tuterId);

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    tuter.isActive = isActive === true || isActive === "true";

    await tuter.save();

    return res.status(200).json({
      msg: tuter.isActive
        ? "Tuter activated successfully"
        : "Tuter deactivated successfully",
      tuter,
    });
  } catch (err) {
    console.log("TOGGLE_TUTER_STATUS_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






















function makeInvitePassword() {
  return crypto.randomBytes(6).toString("base64url") + "A1!";
}

function hashInviteToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// admin invite student
export async function INVITE_STUDENT_ADMIN(req, res) {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        msg: "name, email and phone are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = String(phone).trim();

    const existingUser = await UserSchema.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existingUser) {
      return res.status(409).json({
        msg:
          existingUser.email === cleanEmail
            ? "Student already registered with this email"
            : "Student already registered with this phone number",
      });
    }

    const tempPassword = makeInvitePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const inviteToken = jwt.sign(
      {
        type: "student_invite",
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        tempPass: tempPassword,
      },
      process.env.JWT_TOKEN,
      { expiresIn: "7d" }
    );

    const inviteLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/invite-login?token=${encodeURIComponent(inviteToken)}`;

    const student = await UserSchema.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      pass: hashedPassword,
      role: "student",
      isActive: true,
      invitedBy: req.user._id,
      inviteTokenHash: hashInviteToken(inviteToken),
      inviteTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inviteAcceptedAt: null,
    });

    await sendStudentInviteMail({
      to: cleanEmail,
      name: cleanName,
      inviteLink,
    });

    return res.status(201).json({
      msg: "Student invited successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
        isActive: student.isActive,
        inviteTokenExpires: student.inviteTokenExpires,
      },

      // development testing only
      inviteLink,
      tempPassword,
    });
  } catch (err) {
    console.log("INVITE_STUDENT_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// frontend invite-login page calls this API
export async function VERIFY_STUDENT_INVITE(req, res) {
  try {
    const { inviteToken } = req.params;

    if (!inviteToken) {
      return res.status(400).json({
        msg: "Invite token is required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(inviteToken, process.env.JWT_TOKEN);
    } catch (err) {
      return res.status(400).json({
        msg: "Invalid or expired invite link",
      });
    }

    if (decoded.type !== "student_invite") {
      return res.status(400).json({
        msg: "Invalid invite token type",
      });
    }

    const tokenHash = hashInviteToken(inviteToken);

    const student = await UserSchema.findOne({
      email: decoded.email,
      role: "student",
      inviteTokenHash: tokenHash,
    }).select("-pass");

    if (!student) {
      return res.status(404).json({
        msg: "Invite not found",
      });
    }

    if (
      student.inviteTokenExpires &&
      student.inviteTokenExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        msg: "Invite link expired",
      });
    }

    if (!student.phone && decoded.phone) {
      student.phone = decoded.phone;
    }

    if (!student.inviteAcceptedAt) {
      student.inviteAcceptedAt = new Date();
    }

    await student.save();

    return res.status(200).json({
      msg: "Invite verified successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
      },
      loginData: {
        email: decoded.email,
        phone: decoded.phone || student.phone || "",
        pass: decoded.tempPass,
      },
    });
  } catch (err) {
    console.log("VERIFY_STUDENT_INVITE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}









//delete tuter review


export async function DELETE_TUTER_REVIEW(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const deletedReview = await TuterReviewSchema.findOneAndDelete({
      tuterId,
      studentId: req.user._id,
    });

    if (!deletedReview) {
      return res.status(404).json({ msg: "Review not found" });
    }

    const ratingSummary = await getTuterRatingSummary(tuterId);

    return res.status(200).json({
      msg: "Review deleted successfully",
      averageRating: ratingSummary.averageRating,
      totalReviews: ratingSummary.totalReviews,
    });
  } catch (err) {
    console.log("DELETE_TUTER_REVIEW error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}











//chat

function getChatFileType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

async function getMainAdmin() {
  return await UserSchema.findOne({ role: "admin" }).select("_id name email role photo");
}







export async function CREATE_CONNECT_REQUEST_CHAT(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const student = await UserSchema.findById(req.user._id).select(
      "name email role photo"
    );

    if (!student || student.role !== "student") {
      return res.status(403).json({ msg: "Only student can send connect request" });
    }

    const admin = await getMainAdmin();

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    const tuter = await TuterSchema.findById(tuterId)
      .populate("categoryId", "title key")
      .populate("courseId", "name title sectionType");

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    let room = await ChatRoomSchema.findOne({
      studentId: student._id,
      adminId: admin._id,
    });

    if (!room) {
      room = await ChatRoomSchema.create({
        studentId: student._id,
        adminId: admin._id,
      });
    }

    const courseName = tuter.courseId?.name || tuter.courseId?.title || "Not added";
    const categoryName = tuter.categoryId?.title || "Not added";
    const syllabusName =
      tuter.syllabus && tuter.syllabus !== "none" ? tuter.syllabus : "Not added";

    const studentText = `Hello, my name is ${
      student.name || "Student"
    }. I would like to connect with this tutor. Please help me with the next steps.`;

    const adminText = `${student.name || "Student"} has requested to connect with this tutor. Please review the tutor details and contact the student with the next steps.`;

    const studentConnectCard = {
      tuterId: tuter._id,
      title: "Tutor Details",
      image: tuter.photo || "",
      name: tuter.name || "Not added",
      qualification: tuter.qualification || "Not added",
      courseName,
      categoryName,
      syllabus: syllabusName,
    };

    const adminConnectCard = {
      ...studentConnectCard,
      email: tuter.email || "Not added",
      phone: tuter.phone || "Not added",
    };

    const studentMessage = await ChatMessageSchema.create({
      roomId: room._id,
      senderId: student._id,
      receiverId: admin._id,
      messageType: "connect_card",
      visibleFor: "student",
      text: studentText,
      connectCard: studentConnectCard,
    });

    const adminMessage = await ChatMessageSchema.create({
      roomId: room._id,
      senderId: student._id,
      receiverId: admin._id,
      messageType: "connect_card",
      visibleFor: "admin",
      text: adminText,
      connectCard: adminConnectCard,
    });

    room.lastMessage = "New connect request";
    room.lastMessageAt = new Date();
    await room.save();

    const populatedStudentMessage = await ChatMessageSchema.findById(studentMessage._id)
      .populate("senderId", "name email role photo")
      .populate("receiverId", "name email role photo");

    const populatedAdminMessage = await ChatMessageSchema.findById(adminMessage._id)
      .populate("senderId", "name email role photo")
      .populate("receiverId", "name email role photo");

    const io = getIO();

    if (io) {
      io.to(String(room._id)).emit("new_message", populatedStudentMessage);
      io.to(String(room._id)).emit("newMessage", populatedStudentMessage);

      io.emit("chat_list_updated", {
        roomId: room._id,
        studentId: student._id,
        adminId: admin._id,
      });
    }

    return res.status(201).json({
      msg: "Connect request sent successfully",
      room,
      message: populatedStudentMessage,
      adminMessage: populatedAdminMessage,
    });
  } catch (err) {
    console.log("CREATE_CONNECT_REQUEST_CHAT error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}









export async function CREATE_OR_GET_ADMIN_STUDENT_CHAT(req, res) {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ msg: "Invalid studentId" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can create this chat" });
    }

    const admin = await UserSchema.findById(req.user._id).select(
      "name email role photo"
    );

    const student = await UserSchema.findOne({
      _id: studentId,
      role: "student",
    }).select("name email role photo");

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    let room = await ChatRoomSchema.findOne({
      studentId: student._id,
      adminId: admin._id,
    });

    if (!room) {
      room = await ChatRoomSchema.create({
        studentId: student._id,
        adminId: admin._id,
        lastMessage: "",
        lastMessageAt: new Date(),
      });
    }

    const populatedRoom = await ChatRoomSchema.findById(room._id)
      .populate("studentId", "name email role photo")
      .populate("adminId", "name email role photo");

    return res.status(200).json({
      msg: "Admin student chat room ready",
      room: populatedRoom,
    });
  } catch (err) {
    console.log("CREATE_OR_GET_ADMIN_STUDENT_CHAT error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
















export async function GET_MY_CHAT_ROOMS(req, res) {
  try {
    const query =
      req.user.role === "admin"
        ? { adminId: req.user._id }
        : { studentId: req.user._id };

    const rooms = await ChatRoomSchema.find(query)
      .populate("studentId", "name email role photo")
      .populate("adminId", "name email role photo")
      .sort({ lastMessageAt: -1 });

    const data = rooms.map((room) => {
      const plain = room.toObject();

      return {
        ...plain,
        studentOnline: isUserOnline(plain.studentId?._id),
        adminOnline: isUserOnline(plain.adminId?._id),
      };
    });

    return res.status(200).json({
      msg: "Chat rooms fetched successfully",
      count: data.length,
      rooms: data,
    });
  } catch (err) {
    console.log("GET_MY_CHAT_ROOMS error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}












export async function CREATE_OR_GET_STUDENT_ADMIN_CHAT(req, res) {
  try {
    const student = await UserSchema.findById(req.user._id).select(
      "name email role photo"
    );

    if (!student || student.role !== "student") {
      return res.status(403).json({
        msg: "Only student can create student-admin chat",
      });
    }

    const admin = await getMainAdmin();

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    let room = await ChatRoomSchema.findOne({
      studentId: student._id,
      adminId: admin._id,
    });

    if (!room) {
      room = await ChatRoomSchema.create({
        studentId: student._id,
        adminId: admin._id,
        lastMessage: "",
        lastMessageAt: new Date(),
      });
    }

    const populatedRoom = await ChatRoomSchema.findById(room._id)
      .populate("studentId", "name email role photo")
      .populate("adminId", "name email role photo");

    return res.status(200).json({
      msg: "Student admin chat room ready",
      room: populatedRoom,
    });
  } catch (err) {
    console.log("CREATE_OR_GET_STUDENT_ADMIN_CHAT error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}










export async function GET_CHAT_MESSAGES(req, res) {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ msg: "Invalid roomId" });
    }

    const room = await ChatRoomSchema.findById(roomId);

    if (!room) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    const isAllowed =
      String(room.studentId) === String(req.user._id) ||
      String(room.adminId) === String(req.user._id);

    if (!isAllowed) {
      return res.status(403).json({ msg: "You cannot access this chat" });
    }

    const visibleFilter =
      req.user.role === "admin"
        ? { visibleFor: { $in: ["both", "admin"] } }
        : { visibleFor: { $in: ["both", "student"] } };

    const messages = await ChatMessageSchema.find({
      roomId,
      ...visibleFilter,
    })
      .populate("senderId", "name email role photo")
      .populate("receiverId", "name email role photo")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      msg: "Messages fetched successfully",
      room,
      count: messages.length,
      messages,
    });
  } catch (err) {
    console.log("GET_CHAT_MESSAGES error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}












// text / emoji message
export async function SEND_CHAT_MESSAGE(req, res) {
  try {
    const { roomId } = req.params;
    const { text, messageType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ msg: "Invalid roomId" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Message is required" });
    }

    const room = await ChatRoomSchema.findById(roomId);

    if (!room) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    const isStudent = String(room.studentId) === String(req.user._id);
    const isAdmin = String(room.adminId) === String(req.user._id);

    if (!isStudent && !isAdmin) {
      return res.status(403).json({ msg: "You cannot send message to this chat" });
    }

    const receiverId = isStudent ? room.adminId : room.studentId;

    const finalMessageType = messageType === "emoji" ? "emoji" : "text";

    const message = await ChatMessageSchema.create({
      roomId,
      senderId: req.user._id,
      receiverId,
      messageType: finalMessageType,
      text: text.trim(),
    });

    room.lastMessage = text.trim();
    room.lastMessageAt = new Date();
    await room.save();

    const populatedMessage = await ChatMessageSchema.findById(message._id)
      .populate("senderId", "name email role photo")
      .populate("receiverId", "name email role photo");

    const io = getIO();

    if (io) {
      io.to(String(roomId)).emit("new_message", populatedMessage);
      io.emit("chat_list_updated", { roomId });
    }

    return res.status(201).json({
      msg: "Message sent successfully",
      message: populatedMessage,
    });
  } catch (err) {
    console.log("SEND_CHAT_MESSAGE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}









// image/video/audio/file upload message
export async function SEND_CHAT_FILE_MESSAGE(req, res) {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ msg: "Invalid roomId" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "At least one file is required" });
    }

    const room = await ChatRoomSchema.findById(roomId);

    if (!room) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    const isStudent = String(room.studentId) === String(req.user._id);
    const isAdmin = String(room.adminId) === String(req.user._id);

    if (!isStudent && !isAdmin) {
      return res.status(403).json({ msg: "You cannot send file to this chat" });
    }

    const receiverId = isStudent ? room.adminId : room.studentId;

    const files = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path.replace(/\\/g, "/"),
      mimeType: file.mimetype,
      size: file.size,
      fileType: getChatFileType(file.mimetype),
    }));

    const message = await ChatMessageSchema.create({
      roomId,
      senderId: req.user._id,
      receiverId,
      messageType: "file",
      text: text ? text.trim() : "",
      files,
    });

    room.lastMessage = files.length === 1 ? "File sent" : `${files.length} files sent`;
    room.lastMessageAt = new Date();
    await room.save();

    const populatedMessage = await ChatMessageSchema.findById(message._id)
      .populate("senderId", "name email role photo")
      .populate("receiverId", "name email role photo");

    const io = getIO();

    if (io) {
      io.to(String(roomId)).emit("new_message", populatedMessage);
      io.emit("chat_list_updated", { roomId });
    }

    return res.status(201).json({
      msg: "File message sent successfully",
      message: populatedMessage,
    });
  } catch (err) {
    console.log("SEND_CHAT_FILE_MESSAGE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}









// mark read
export async function MARK_CHAT_MESSAGES_READ(req, res) {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ msg: "Invalid roomId" });
    }

    const room = await ChatRoomSchema.findById(roomId);

    if (!room) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    const isAllowed =
      String(room.studentId) === String(req.user._id) ||
      String(room.adminId) === String(req.user._id);

    if (!isAllowed) {
      return res.status(403).json({ msg: "You cannot access this chat" });
    }

    await ChatMessageSchema.updateMany(
      {
        roomId,
        receiverId: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({
      msg: "Messages marked as read",
    });
  } catch (err) {
    console.log("MARK_CHAT_MESSAGES_READ error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






















//update chatmessage



export async function UPDATE_CHAT_MESSAGE(req, res) {
  try {
    const { messageId } = req.params;
    const { message, text } = req.body;

    const newText = message || text;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Invalid messageId" });
    }

    if (!newText || !newText.trim()) {
      return res.status(400).json({ msg: "Message text is required" });
    }

    const chatMessage = await ChatMessageSchema.findById(messageId);

    if (!chatMessage) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (String(chatMessage.senderId) !== String(req.user._id)) {
      return res.status(403).json({ msg: "You can edit only your messages" });
    }

    if (
      chatMessage.messageType === "connect_request" ||
      chatMessage.isAutomatic === true
    ) {
      return res.status(403).json({ msg: "Automatic message cannot be edited" });
    }

    chatMessage.message = newText.trim();
    chatMessage.text = newText.trim();
    chatMessage.isEdited = true;
    chatMessage.editedAt = new Date();

    await chatMessage.save();

    const io = getIO();
    io.to(String(chatMessage.roomId)).emit("messageUpdated", chatMessage);

    return res.status(200).json({
      msg: "Message updated successfully",
      message: chatMessage,
    });
  } catch (err) {
    console.log("UPDATE_CHAT_MESSAGE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}








//delete chatmessage




export async function DELETE_CHAT_MESSAGE(req, res) {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Invalid messageId" });
    }

    const chatMessage = await ChatMessageSchema.findById(messageId);

    if (!chatMessage) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (String(chatMessage.senderId) !== String(req.user._id)) {
      return res.status(403).json({ msg: "You can delete only your messages" });
    }

    if (
      chatMessage.messageType === "connect_request" ||
      chatMessage.isAutomatic === true
    ) {
      return res.status(403).json({ msg: "Automatic message cannot be deleted" });
    }

    const roomId = chatMessage.roomId;

    await ChatMessageSchema.findByIdAndDelete(messageId);

    const io = getIO();
    io.to(String(roomId)).emit("messageDeleted", {
      messageId,
      roomId,
    });

    return res.status(200).json({
      msg: "Message deleted successfully",
      messageId,
      roomId,
    });
  } catch (err) {
    console.log("DELETE_CHAT_MESSAGE error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

















// ================= ADMIN DASHBOARD =================

export async function ADMIN_DASHBOARD(req, res) {
  try {
    const now = new Date();

    // 24 hours ago
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 30 days ago
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ================= 1. NEW SIGNUPS (24h) =================
    const newSignups = await UserSchema.countDocuments({
      createdAt: { $gte: last24Hours },
    });

    // ================= 2. TOTAL STUDENTS =================
    const totalStudents = await UserSchema.countDocuments({
      role: "student",
    });

    // ================= 3. ACTIVE TUTORS =================
    const activeTutors = await TuterSchema.countDocuments({
      isActive: true,
    });

    // ================= 4. LAST 30 DAYS GRAPH =================
    const last30DaysData = await UserSchema.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    // format graph data
    const graphData = last30DaysData.map((item) => {
      return {
        date: `${item._id.year}-${item._id.month}-${item._id.day}`,
        users: item.count,
      };
    });

    return res.status(200).json({
      msg: "Dashboard data fetched successfully",
      data: {
        newSignups,
        totalStudents,
        activeTutors,
        graphData,
      },
    });
  } catch (err) {
    console.log("ADMIN_DASHBOARD error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}








//website feedback


export async function ADD_FEEDBACK(req, res) {
  try {
    const { rating, message } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        msg: "Rating must be between 1 and 5",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        msg: "Feedback message is required",
      });
    }

    const feedback = await FeedbackSchema.findOneAndUpdate(
      { studentId: req.user._id },
      {
        rating: Number(rating),
        message: message.trim(),
      },
      {
        new: true,
        upsert: true,
      }
    ).populate("studentId", "name email photo");

    return res.status(200).json({
      msg: "Feedback submitted successfully",
      feedback,
    });
  } catch (err) {
    console.log("ADD_FEEDBACK error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






//get all feedback

export async function GET_ALL_FEEDBACK(req, res) {
  try {
    const feedbacks = await FeedbackSchema.find()
      .populate("studentId", "name email photo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      msg: "All feedback fetched successfully",
      count: feedbacks.length,
      feedbacks,
    });
  } catch (err) {
    console.log("GET_ALL_FEEDBACK_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}







//get may feedback

export async function GET_MY_FEEDBACK(req, res) {
  try {
    const feedback = await FeedbackSchema.findOne({
      studentId: req.user._id,
    }).populate("studentId", "name email photo");

    return res.status(200).json({
      msg: "My feedback fetched successfully",
      feedback,
    });
  } catch (err) {
    console.log("GET_MY_FEEDBACK error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}