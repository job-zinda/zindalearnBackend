
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
import StudentTutorAssignSchema from "./Models/StudentTutorAssign.js";
import { assign } from "nodemailer/lib/shared/index.js";












// ===================== CLOUDINARY FILE HELPERS =====================
function getUploadedFileUrl(file) {
  if (!file) return "";
  return String(file.secure_url || file.url || file.path || "").replace(/\\/g, "/");
}

function getUploadedFileName(file) {
  if (!file) return "";
  return file.filename || file.public_id || file.originalname || "";
}












export function makeOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}




// export async function REGISTER(req, res) {
//   try {
//     const { name, email, phone, pass, cpass } = req.body;

//     if (!name || !email || !phone || !pass || !cpass) {
//       return res.status(400).json({
//         msg: "name, email, phone, pass, cpass are required",
//       });
//     }

//     if (pass !== cpass) {
//       return res.status(400).json({ msg: "Password mismatch" });
//     }

//     const cleanEmail = email.toLowerCase().trim();
//     const cleanPhone = String(phone).trim();

//     const existing = await UserSchema.findOne({
//       $or: [{ email: cleanEmail }, { phone: cleanPhone }],
//     });

//     if (existing) {
//       return res.status(409).json({
//         msg:
//           existing.email === cleanEmail
//             ? "User already exists, please login"
//             : "Phone number already exists",
//       });
//     }

//     const hashed = await bcrypt.hash(pass, 10);

//     const user = await UserSchema.create({
//       name: name.trim(),
//       email: cleanEmail,
//       phone: cleanPhone,
//       pass: hashed,
//     });

//     return res.status(201).json({
//       msg: "Registration successful",
//       userId: user._id,
//     });
//   } catch (err) {
//     console.log("REGISTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }



export async function REGISTER(req, res) {
  try {
    const { name, email, phone, pass, cpass } = req.body;

    if (!name || !email || !phone || !pass || !cpass) {
      return res.status(400).json({
        msg: "name, email, phone, pass, cpass are required",
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPhone = String(phone).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        msg: "Please enter a valid email address",
      });
    }

    if (pass !== cpass) {
      return res.status(400).json({ msg: "Password mismatch" });
    }

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
      name: String(name).trim(),
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



// export async function LOGIN(req, res) {
//   try {
//     const { email, phone, pass } = req.body;

//     // validation
//     if ((!email && !phone) || !pass) {
//       return res.status(400).json({
//         msg: "Email or phone and password are required",
//       });
//     }

//     const cleanEmail = email ? email.toLowerCase().trim() : null;
//     const cleanPhone = phone ? String(phone).trim() : null;

//     // find user by email OR phone
//     const user = await UserSchema.findOne({
//       $or: [
//         cleanEmail ? { email: cleanEmail } : null,
//         cleanPhone ? { phone: cleanPhone } : null,
//       ].filter(Boolean),
//     });

//     if (!user) {
//       return res.status(404).json({
//         msg: "User not found",
//       });
//     }

//     // check blocked
//     if (user.isActive === false) {
//       return res.status(403).json({
//         msg: "Account blocked by admin",
//       });
//     }

//     // check password
//     const success = await bcrypt.compare(pass, user.pass);

//     if (!success) {
//       return res.status(401).json({
//         msg: "Incorrect password",
//       });
//     }

//     // generate token
//     const token = jwt.sign(
//       {
//         id: user._id,
//         email: user.email,
//         phone: user.phone,
//         syllabus: user.syllabus,
//         role: user.role,
//       },
//       process.env.JWT_TOKEN,
//       { expiresIn: "24h" }
//     );

//     return res.status(200).json({
//       msg: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         syllabus: user.syllabus,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.log("LOGIN error:", err.message);
//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }










export async function LOGIN(req, res) {
  try {
    const { email, phone, pass } = req.body;

    if ((!email && !phone) || !pass) {
      return res.status(400).json({
        msg: "Email or phone and password are required",
      });
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    const cleanPhone = phone ? String(phone).trim() : null;

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

    // if (user.isActive === false) {
    //   return res.status(403).json({
    //     msg: "Account blocked by admin",
    //   });
    // }




if (user.isBlocked === true || user.isActive === false) {
  return res.status(403).json({
    msg: "Account blocked by admin",
  });
}



    const success = await bcrypt.compare(pass, user.pass);

    if (!success) {
      return res.status(401).json({
        msg: "Incorrect password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
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
        role: user.role,
        photo: user.photo,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.log("LOGIN error:", err.message);
    return res.status(500).json({
      error: err.message,
    });
  }
}













// //admin change password

// export async function CHANGE_PASSWORD(req, res) {
//   try {
//     const { oldPass, newPass, confirmPass } = req.body;

//     if (!oldPass || !newPass || !confirmPass) {
//       return res.status(400).json({
//         msg: "oldPass, newPass and confirmPass are required",
//       });
//     }

//     if (newPass !== confirmPass) {
//       return res.status(400).json({
//         msg: "New password and confirm password do not match",
//       });
//     }

//     const user = await UserSchema.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({
//         msg: "User not found",
//       });
//     }

//     const isMatch = await bcrypt.compare(oldPass, user.pass);

//     if (!isMatch) {
//       return res.status(401).json({
//         msg: "Current password is incorrect",
//       });
//     }

//     const samePassword = await bcrypt.compare(newPass, user.pass);

//     if (samePassword) {
//       return res.status(400).json({
//         msg: "New password must be different from current password",
//       });
//     }

//     user.pass = await bcrypt.hash(newPass, 10);
//     user.passwordChangedAt = new Date();

//     await user.save();

//     return res.status(200).json({
//       msg: "Password changed successfully",
//     });
//   } catch (err) {
//     console.log("CHANGE_PASSWORD error:", err.message);
//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }












// change password
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

    await syncTutorVisiblePassword(user, newPass);

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

// export async function RESET_PASSWORD(req, res) {
//   try {
//     const { email, newpass, confirmpass } = req.body;

//     if (!email || !newpass || !confirmpass) {
//       return res.status(400).json({ msg: "All fields required" });
//     }

//     if (newpass !== confirmpass) {
//       return res.status(400).json({ msg: "Password mismatch" });
//     }

//     const user = await UserSchema.findOne({ email });

//     if (!user || !user.resetPasswordOtpVerified) {
//       return res.status(403).json({ msg: "OTP not verified" });
//     }

//     const hashed = await bcrypt.hash(newpass, 10);

//     user.pass = hashed;
//     user.passwordChangedAt = new Date();

//     // clear OTP
//     user.resetPasswordOtp = null;
//     user.resetPasswordOtpExpires = null;
//     user.resetPasswordOtpVerified = false;

//     await user.save();

//     return res.status(200).json({ msg: "Password reset successful" });

//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }















// reset password
export async function RESET_PASSWORD(req, res) {
  try {
    const { email, newpass, confirmpass } = req.body;

    if (!email || !newpass || !confirmpass) {
      return res.status(400).json({
        msg: "All fields required",
      });
    }

    if (newpass !== confirmpass) {
      return res.status(400).json({
        msg: "Password mismatch",
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const user = await UserSchema.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (!user.resetPasswordOtpVerified) {
      return res.status(403).json({
        msg: "OTP not verified",
      });
    }

    const hashed = await bcrypt.hash(newpass, 10);

    user.pass = hashed;
    user.passwordChangedAt = new Date();

    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpVerified = false;

    await user.save();

    await syncTutorVisiblePassword(user, newpass);

    return res.status(200).json({
      msg: "Password reset successful",
    });
  } catch (err) {
    console.log("RESET_PASSWORD error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
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















// export async function DELETE_MY_ACCOUNT(req, res) {
//   try {
//     const user = await UserSchema.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({ msg: "User not found" });
//     }

//     await FeedbackSchema.deleteMany({ studentId: req.user._id });
//     await TuterReviewSchema.deleteMany({ studentId: req.user._id });
//     await ChatMessageSchema.deleteMany({ senderId: req.user._id });
//     await ChatRoomSchema.deleteMany({
//       $or: [{ studentId: req.user._id }, { adminId: req.user._id }],
//     });

//     await UserSchema.findByIdAndDelete(req.user._id);

//     return res.status(200).json({
//       msg: "Account deleted successfully",
//     });
//   } catch (err) {
//     console.log("DELETE_MY_ACCOUNT error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }











export async function DELETE_MY_ACCOUNT(req, res) {
  try {
    const user = await UserSchema.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await FeedbackSchema.deleteMany({ studentId: req.user._id });
    await TuterReviewSchema.deleteMany({ studentId: req.user._id });
    await StudentTutorAssignSchema.deleteMany({ studentId: req.user._id });
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
      image: getUploadedFileUrl(req.file),
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

    // local file ആണെങ്കിൽ മാത്രം delete ചെയ്യുക
    if (
      banner.image &&
      !String(banner.image).startsWith("http") &&
      fs.existsSync(banner.image)
    ) {
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
      // local file ആണെങ്കിൽ മാത്രം delete ചെയ്യുക
      if (
        banner.image &&
        !String(banner.image).startsWith("http") &&
        fs.existsSync(banner.image)
      ) {
        fs.unlinkSync(banner.image);
      }

      // cloudinary url save ചെയ്യുക
      banner.image = getUploadedFileUrl(req.file);
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
      if (
        category.image &&
        !String(category.image).startsWith("http") &&
        fs.existsSync(category.image)
      ) {
        fs.unlinkSync(category.image);
      }

      category.image = getUploadedFileUrl(req.file);
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
      image: req.file ? getUploadedFileUrl(req.file) : "",
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
      if (
        course.image &&
        !String(course.image).startsWith("http") &&
        fs.existsSync(course.image)
      ) {
        fs.unlinkSync(course.image);
      }

      course.image = getUploadedFileUrl(req.file);
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

    if (
      course.image &&
      !String(course.image).startsWith("http") &&
      fs.existsSync(course.image)
    ) {
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

// function parseSubjects(subjects) {
//   if (!subjects) return [];

//   if (Array.isArray(subjects)) {
//     return subjects.map((s) => String(s).trim()).filter(Boolean);
//   }

//   return String(subjects)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }





































/////////////////////////////////////////////////////////////////////////////////////////////////////////


// function parseCourseIds(body) {
//   const raw = body.courseIds || body.courseId;

//   if (!raw) return [];

//   if (Array.isArray(raw)) {
//     return raw.map((id) => String(id).trim()).filter(Boolean);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);function parseCourseIds
// }

// function hasValidObjectIds(ids) {
//   return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
// }



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////









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



// export async function CREATE_TUTER(req, res) {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       courseId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     if (!name || !phone || !categoryId || !courseId) {
//       return res.status(400).json({
//         msg: "name, phone, categoryId and courseId are required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(courseId)) {
//       return res.status(400).json({ msg: "Invalid courseId" });
//     }

//     const category = await CategorySchema.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const course = await CourseSchema.findById(courseId);
//     if (!course) {
//       return res.status(404).json({ msg: "Course not found" });
//     }

//     if (String(course.categoryId) !== String(categoryId)) {
//       return res.status(400).json({
//         msg: "Selected course does not belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       if (!sectionType || !["one_to_one", "batch"].includes(sectionType)) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one or batch",
//         });
//       }

//       if (course.sectionType !== sectionType) {
//         return res.status(400).json({
//           msg: "Selected course does not belong to selected section",
//         });
//       }

//       if (!syllabus || !["state", "cbse", "icse"].includes(syllabus)) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus must be state, cbse or icse",
//         });
//       }

//       finalSectionType = sectionType;
//       finalSyllabus = syllabus;
//     }

//     const tuter = await TuterSchema.create({
//       name: name.trim(),
//       email: email ? email.trim().toLowerCase() : "",
//       phone: phone.trim(),
//       qualification: qualification ? qualification.trim() : "",
//       about: about ? about.trim() : "",
//       subjects: parseSubjects(subjects),
//       categoryId,
//       courseId,
//       sectionType: finalSectionType,
//       syllabus: finalSyllabus,
//       photo: req.file ? getUploadedFileUrl(req.file) : "",
//       isActive:
//         isActive !== undefined
//           ? isActive === "true" || isActive === true
//           : true,
//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Tuter created successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("CREATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }












// export async function CREATE_TUTER(req, res) {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     const courseIds = parseCourseIds(req.body);

//     if (!name || !phone || !categoryId || courseIds.length === 0) {
//       return res.status(400).json({
//         msg: "name, phone, categoryId and at least one courseId are required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!hasValidObjectIds(courseIds)) {
//       return res.status(400).json({ msg: "Invalid courseIds" });
//     }

//     const category = await CategorySchema.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: courseIds },
//     });

//     if (courses.length !== courseIds.length) {
//       return res.status(404).json({ msg: "One or more courses not found" });
//     }

//     const invalidCategoryCourse = courses.find(
//       (course) => String(course.categoryId) !== String(categoryId)
//     );

//     if (invalidCategoryCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       if (
//         !sectionType ||
//         !["one_to_one", "batch", "both"].includes(sectionType)
//       ) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one, batch or both",
//         });
//       }

//       if (sectionType !== "both") {
//         const invalidSectionCourse = courses.find(
//           (course) => course.sectionType !== sectionType
//         );

//         if (invalidSectionCourse) {
//           return res.status(400).json({
//             msg: "Selected courses do not belong to selected section",
//           });
//         }
//       }

//       if (sectionType === "both") {
//         const invalidBothCourse = courses.find(
//           (course) =>
//             course.sectionType !== "one_to_one" &&
//             course.sectionType !== "batch"
//         );

//         if (invalidBothCourse) {
//           return res.status(400).json({
//             msg: "For both, select only one-to-one or batch courses",
//           });
//         }
//       }

//       if (!syllabus || !["state", "cbse", "icse"].includes(syllabus)) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus must be state, cbse or icse",
//         });
//       }

//       finalSectionType = sectionType;
//       finalSyllabus = syllabus;
//     }

//     const tuter = await TuterSchema.create({
//       name: name.trim(),
//       email: email ? email.trim().toLowerCase() : "",
//       phone: phone.trim(),
//       qualification: qualification ? qualification.trim() : "",
//       about: about ? about.trim() : "",
//       subjects: parseSubjects(subjects),

//       categoryId,
//       courseId: courseIds[0],
//       courseIds,

//       sectionType: finalSectionType,
//       syllabus: finalSyllabus,
//       photo: req.file ? getUploadedFileUrl(req.file) : "",

//       isActive:
//         isActive !== undefined
//           ? isActive === "true" || isActive === true
//           : true,

//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Tuter created successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("CREATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }








// function parseCategoryIds(body) {
//   const raw = body.categoryIds || body.categoryId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }






// function parseCategoryIds(body) {
//   const raw = body.categoryIds || body.categoryId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function parseCourseIds(body) {
//   const raw = body.courseIds || body.courseId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function hasValidObjectIds(ids=[]) {
//   return ids.every((id)=>
//     mongoose.Types.ObjectId.isValid(id)
//   );
// }












// function parseCategoryIds(body) {
//   const raw = body.categoryIds || body.categoryId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function parseCourseIds(body) {
//   const raw = body.courseIds || body.courseId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function hasValidObjectIds(ids = []) {
//   return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
// }





// function parseSubjects(subjects) {
//   if (!subjects) return [];

//   if (Array.isArray(subjects)) {
//     return subjects.map((s) => String(s).trim()).filter(Boolean);
//   }

//   return String(subjects)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function parseCategoryIds(body) {
//   const raw = body.categoryIds || body.categoryId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function parseCourseIds(body) {
//   const raw = body.courseIds || body.courseId || [];

//   if (Array.isArray(raw)) {
//     return raw.filter(Boolean).map(String);
//   }

//   return String(raw)
//     .split(",")
//     .map((id) => id.trim())
//     .filter(Boolean);
// }

// function hasValidObjectIds(ids = []) {
//   return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
// }







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

function parseCategoryIds(body) {
  const raw = body.categoryIds || body.categoryId || [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map(String);
  }

  return String(raw)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseCourseIds(body) {
  const raw = body.courseIds || body.courseId || [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map(String);
  }

  return String(raw)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function hasValidObjectIds(ids = []) {
  return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
}




// export async function CREATE_TUTER(req, res) {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     const courseIds = parseCourseIds(req.body);

//     if (!name || !phone || !categoryId || courseIds.length === 0) {
//       return res.status(400).json({
//         msg: "name, phone, categoryId and at least one courseId are required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!hasValidObjectIds(courseIds)) {
//       return res.status(400).json({ msg: "Invalid courseIds" });
//     }

//     const category = await CategorySchema.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: courseIds },
//     });

//     if (courses.length !== courseIds.length) {
//       return res.status(404).json({ msg: "One or more courses not found" });
//     }

//     const invalidCategoryCourse = courses.find(
//       (course) => String(course.categoryId) !== String(categoryId)
//     );

//     if (invalidCategoryCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       if (
//         !sectionType ||
//         !["one_to_one", "batch", "both"].includes(sectionType)
//       ) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one, batch or both",
//         });
//       }

//       if (sectionType !== "both") {
//         const invalidSectionCourse = courses.find(
//           (course) => course.sectionType !== sectionType
//         );

//         if (invalidSectionCourse) {
//           return res.status(400).json({
//             msg: "Selected courses do not belong to selected section",
//           });
//         }
//       }

//       if (sectionType === "both") {
//         const invalidBothCourse = courses.find(
//           (course) =>
//             course.sectionType !== "one_to_one" &&
//             course.sectionType !== "batch"
//         );

//         if (invalidBothCourse) {
//           return res.status(400).json({
//             msg: "For both, select only one-to-one or batch courses",
//           });
//         }
//       }

//      if (!syllabus || !String(syllabus).trim()) {
//   return res.status(400).json({
//     msg: "For Online Tuition, syllabus is required",
//   });
// }

// finalSyllabus = String(syllabus).trim();

//       finalSectionType = sectionType;
//       finalSyllabus = String(syllabus).trim();
//     }

//     const tuter = await TuterSchema.create({
//       name: name.trim(),
//       email: email ? email.trim().toLowerCase() : "",
//       phone: phone.trim(),
//       qualification: qualification ? qualification.trim() : "",
//       about: about ? about.trim() : "",
//       subjects: parseSubjects(subjects),

//       categoryId,
//       courseId: courseIds[0],
//       courseIds,

//       sectionType: finalSectionType,
//       syllabus: finalSyllabus,
//       photo: req.file ? getUploadedFileUrl(req.file) : "",

//       isActive:
//         isActive !== undefined
//           ? isActive === "true" || isActive === true
//           : true,

//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Tuter created successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("CREATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }










// export async function CREATE_TUTER(req,res){
// try{

// const{
// name,
// email,
// phone,
// qualification,
// about,
// subjects,
// syllabus,
// isActive
// }=req.body;

// const categoryIds=parseCategoryIds(req.body);

// const courseIds=parseCourseIds(req.body);

// if(
// !name ||
// !phone ||
// categoryIds.length===0 ||
// courseIds.length===0
// ){
// return res.status(400).json({
// msg:"name, phone, at least one category and one course required"
// });
// }

// if(!hasValidObjectIds(categoryIds)){
// return res.status(400).json({
// msg:"Invalid categoryIds"
// });
// }

// if(!hasValidObjectIds(courseIds)){
// return res.status(400).json({
// msg:"Invalid courseIds"
// });
// }

// const categories=
// await CategorySchema.find({
// _id:{
// $in:categoryIds
// }
// });

// if(categories.length!==categoryIds.length){
// return res.status(404).json({
// msg:"One or more categories not found"
// });
// }

// const courses=
// await CourseSchema.find({
// _id:{
// $in:courseIds
// }
// });

// if(courses.length!==courseIds.length){
// return res.status(404).json({
// msg:"One or more courses not found"
// });
// }

// const invalidCourse=
// courses.find(
// course=>
// !categoryIds.includes(
// String(course.categoryId)
// )
// );

// if(invalidCourse){
// return res.status(400).json({
// msg:"Selected course not in selected category"
// });
// }

// const hasOnline=
// categories.some(
// cat=>cat.key==="online_tuition"
// );

// let finalSyllabus="none";

// let finalSectionType="none";

// if(hasOnline){

// if(
// !syllabus ||
// !String(syllabus).trim()
// ){
// return res.status(400).json({
// msg:"Syllabus required"
// });
// }

// finalSyllabus=
// String(syllabus).trim();

// finalSectionType="both";

// }

// const tuter=
// await TuterSchema.create({

// name:name.trim(),

// email:
// email?
// email.trim().toLowerCase()
// :"",

// phone:phone.trim(),

// qualification:
// qualification?
// qualification.trim()
// :"",

// about:
// about?
// about.trim()
// :"",

// subjects:
// parseSubjects(subjects),

// categoryId:
// categoryIds[0],

// categoryIds,

// courseId:
// courseIds[0],

// courseIds,

// sectionType:
// finalSectionType,

// syllabus:
// finalSyllabus,

// photo:
// req.file?
// getUploadedFileUrl(req.file)
// :"",

// isActive:
// isActive!==undefined
// ?
// isActive==="true"||
// isActive===true
// :
// true,

// createdBy:
// req.user._id

// });

// return res.status(201).json({
// msg:"Tutor created",
// tuter
// });

// }
// catch(err){

// console.log(
// "CREATE_TUTER:",
// err.message
// );

// return res.status(500).json({
// error:err.message
// });

// }
// }





// export async function CREATE_TUTER(req, res) {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       syllabus,
//       isActive,
//     } = req.body;

//     const categoryIds = parseCategoryIds(req.body);
//     const courseIds = parseCourseIds(req.body);

//     if (!name || !phone || categoryIds.length === 0 || courseIds.length === 0) {
//       return res.status(400).json({
//         msg: "name, phone, at least one category and at least one course are required",
//       });
//     }

//     if (!hasValidObjectIds(categoryIds)) {
//       return res.status(400).json({
//         msg: "Invalid categoryIds",
//       });
//     }

//     if (!hasValidObjectIds(courseIds)) {
//       return res.status(400).json({
//         msg: "Invalid courseIds",
//       });
//     }

//     const categories = await CategorySchema.find({
//       _id: { $in: categoryIds },
//     });

//     if (categories.length !== categoryIds.length) {
//       return res.status(404).json({
//         msg: "One or more categories not found",
//       });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: courseIds },
//     });

//     if (courses.length !== courseIds.length) {
//       return res.status(404).json({
//         msg: "One or more courses not found",
//       });
//     }

//     const selectedCategorySet = new Set(categoryIds.map(String));

//     const invalidCourse = courses.find((course) => {
//       return !selectedCategorySet.has(String(course.categoryId));
//     });

//     if (invalidCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected categories",
//       });
//     }

//     const hasOnlineTuition = categories.some(
//       (cat) => cat.key === "online_tuition"
//     );

//     let finalSyllabus = "none";
//     let finalSectionType = "none";

//     if (hasOnlineTuition) {
//       if (!syllabus || !String(syllabus).trim()) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus is required",
//         });
//       }

//       finalSyllabus = String(syllabus).trim();
//       finalSectionType = "both";
//     }

//     const tuter = await TuterSchema.create({
//       name: String(name).trim(),
//       email: email ? String(email).trim().toLowerCase() : "",
//       phone: String(phone).trim(),
//       qualification: qualification ? String(qualification).trim() : "",
//       about: about ? String(about).trim() : "",
//       subjects: parseSubjects(subjects),

//       // old support
//       categoryId: categoryIds[0],
//       courseId: courseIds[0],

//       // new multiple support
//       categoryIds,
//       courseIds,

//       sectionType: finalSectionType,
//       syllabus: finalSyllabus,

//       photo: req.file ? getUploadedFileUrl(req.file) : "",

//       isActive:
//         isActive !== undefined
//           ? isActive === "true" || isActive === true
//           : true,

//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Tuter created successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("CREATE_TUTER error:", err.message);
//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }






export async function GENERATE_TUTOR_PASSWORD(req, res) {
  try {
    const password = generateTutorPassword();

    return res.status(200).json({
      msg: "Tutor password generated successfully",
      password,
    });
  } catch (err) {
    console.log("GENERATE_TUTOR_PASSWORD error:", err.message);
    return res.status(500).json({ error: err.message });
  }
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
      syllabus,
      isActive,
      loginPasswordText,
    } = req.body;

    const categoryIds = parseCategoryIds(req.body);
    const courseIds = parseCourseIds(req.body);

    if (!name || !phone || categoryIds.length === 0 || courseIds.length === 0) {
      return res.status(400).json({
        msg: "name, phone, at least one category and at least one course are required",
      });
    }

    if (!hasValidObjectIds(categoryIds)) {
      return res.status(400).json({ msg: "Invalid categoryIds" });
    }

    if (!hasValidObjectIds(courseIds)) {
      return res.status(400).json({ msg: "Invalid courseIds" });
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : "";
    const cleanPhone = String(phone).trim();

    if (!cleanEmail) {
      return res.status(400).json({
        msg: "Tutor email is required for login",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        msg: "Please enter a valid tutor email address",
      });
    }

    const categories = await CategorySchema.find({
      _id: { $in: categoryIds },
    });

    if (categories.length !== categoryIds.length) {
      return res.status(404).json({ msg: "One or more categories not found" });
    }

    const courses = await CourseSchema.find({
      _id: { $in: courseIds },
    });

    if (courses.length !== courseIds.length) {
      return res.status(404).json({ msg: "One or more courses not found" });
    }

    const allowedCategorySet = new Set(categoryIds.map(String));

    const invalidCourse = courses.find(
      (course) => !allowedCategorySet.has(String(course.categoryId))
    );

    if (invalidCourse) {
      return res.status(400).json({
        msg: "Selected courses must belong to selected category",
      });
    }

    const onlineCategory = categories.find((cat) => cat.key === "online_tuition");

    let finalSyllabus = "none";
    let finalSectionType = "none";

    if (onlineCategory) {
      if (!syllabus || !String(syllabus).trim()) {
        return res.status(400).json({
          msg: "For Online Tuition, syllabus is required",
        });
      }

      finalSyllabus = String(syllabus).trim();

      const onlineCourseIds = courses
        .filter((course) => String(course.categoryId) === String(onlineCategory._id))
        .map((course) => course.sectionType);

      if (onlineCourseIds.includes("one_to_one") && onlineCourseIds.includes("batch")) {
        finalSectionType = "both";
      } else if (onlineCourseIds.includes("one_to_one")) {
        finalSectionType = "one_to_one";
      } else if (onlineCourseIds.includes("batch")) {
        finalSectionType = "batch";
      } else {
        finalSectionType = "none";
      }
    }

    const existingLoginUser = await UserSchema.findOne({
      $or: [
        { email: cleanEmail },
        cleanPhone ? { phone: cleanPhone } : null,
      ].filter(Boolean),
    });

    if (existingLoginUser) {
      return res.status(409).json({
        msg:
          existingLoginUser.email === cleanEmail
            ? "Tutor email already exists"
            : "Tutor phone already exists",
      });
    }

    const uploadedPhoto = req.file ? getUploadedFileUrl(req.file) : "";

    const finalTutorPassword =
      loginPasswordText && String(loginPasswordText).trim()
        ? String(loginPasswordText).trim()
        : generateTutorPassword();

    const hashedTutorPassword = await bcrypt.hash(finalTutorPassword, 10);

    const tutorLoginUser = await UserSchema.create({
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone,
      pass: hashedTutorPassword,
      role: "tutor",
      photo: uploadedPhoto,
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
    });

    const tuter = await TuterSchema.create({
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone,
      qualification: qualification ? String(qualification).trim() : "",
      about: about ? String(about).trim() : "",
      subjects: parseSubjects(subjects),

      categoryId: categoryIds[0],
      categoryIds,

      courseId: courseIds[0],
      courseIds,

      sectionType: finalSectionType,
      syllabus: finalSyllabus,
      photo: uploadedPhoto,

      loginUserId: tutorLoginUser._id,
      loginPasswordText: finalTutorPassword,

      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,

      createdBy: req.user._id,
    });

    return res.status(201).json({
      msg: "Tuter created successfully",
      tuter,
      loginPassword: finalTutorPassword,
    });
  } catch (err) {
    console.log("CREATE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






// admin get all tuters



// export async function GET_ALL_TUTERS_ADMIN(req, res) {
//   try {
//     const tuters = await TuterSchema.find()
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType")
//       .populate("createdBy", "name email role")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "All tuters fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_ALL_TUTERS_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }




























// export async function GET_ALL_TUTERS_ADMIN(req, res) {
//   try {
//     const tuters = await TuterSchema.find()
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType categoryId")
//       .populate("courseIds", "name description image sectionType categoryId")
//       .populate("createdBy", "name email role")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "All tuters fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_ALL_TUTERS_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }











export async function GET_ALL_TUTERS_ADMIN(req, res) {
  try {
    const tuters = await TuterSchema.find()
      .populate("categoryId", "key title image")
      .populate("categoryIds", "key title image")
      .populate("courseId", "name description image sectionType categoryId")
      .populate("courseIds", "name description image sectionType categoryId")
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











// // user/admin get tuters by course
// export async function GET_TUTERS_BY_COURSE(req, res) {
//   try {
//     const { courseId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(courseId)) {
//       return res.status(400).json({ msg: "Invalid courseId" });
//     }

//     const tuters = await TuterSchema.find({
//       courseId,
//       isActive: true,
//     })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "Tutors fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_TUTERS_BY_COURSE error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }











// export async function GET_TUTERS_BY_COURSE(req, res) {
//   try {
//     const { courseId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(courseId)) {
//       return res.status(400).json({ msg: "Invalid courseId" });
//     }

//     const tuters = await TuterSchema.find({
//       $or: [{ courseId }, { courseIds: courseId }],
//       isActive: true,
//     })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType categoryId")
//       .populate("courseIds", "name description image sectionType categoryId")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "Tutors fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_TUTERS_BY_COURSE error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }













// export async function GET_TUTERS_BY_COURSE(req, res) {
//   try {
//     const { courseId } = req.params;

//     // ✅ validate course id
//     if (!mongoose.Types.ObjectId.isValid(courseId)) {
//       return res.status(400).json({
//         msg: "Invalid courseId",
//       });
//     }

//     // ✅ get tutors from:
//     // 1. old single course data
//     // 2. new multiple courseIds data
//     const tuters = await TuterSchema.find({
//       isActive: true,
//       $or: [
//         { courseId: courseId },
//         { courseIds: { $in: [courseId] } },
//       ],
//     })
//       .populate(
//         "categoryId",
//         "key title description image"
//       )
//       .populate(
//         "courseId",
//         "name description image sectionType categoryId"
//       )
//       .populate(
//         "courseIds",
//         "name description image sectionType categoryId"
//       )
//       .sort({ createdAt: -1 });

//     // ✅ attach ratings + reviews
//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "Tutors fetched successfully",
//       count: data.length,
//       tuters: data,
//     });

//   } catch (err) {
//     console.log("GET_TUTERS_BY_COURSE error:", err.message);

//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }










export async function GET_TUTERS_BY_COURSE(req, res) {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid courseId" });
    }

    const tuters = await TuterSchema.find({
      isActive: true,
      $or: [
        { courseId },
        { courseIds: { $in: [courseId] } },
      ],
    })
      .populate("categoryId", "key title description image")
      .populate("categoryIds", "key title description image")
      .populate("courseId", "name description image sectionType categoryId")
      .populate("courseIds", "name description image sectionType categoryId")
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






// // user/admin get single tuter
// export async function GET_SINGLE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId)
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType")
//       .populate("createdBy", "name email role");

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     const data = await attachRatingAndReviews(tuter);

//     return res.status(200).json({
//       msg: "Tuter fetched successfully",
//       tuter: data,
//     });
//   } catch (err) {
//     console.log("GET_SINGLE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }











// export async function GET_SINGLE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId)
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType categoryId")
//       .populate("courseIds", "name description image sectionType categoryId")
//       .populate("createdBy", "name email role");

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     const data = await attachRatingAndReviews(tuter);

//     return res.status(200).json({
//       msg: "Tuter fetched successfully",
//       tuter: data,
//     });
//   } catch (err) {
//     console.log("GET_SINGLE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }




export async function GET_SINGLE_TUTER(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    const tuter = await TuterSchema.findById(tuterId)
      .populate("categoryId", "key title image")
      .populate("categoryIds", "key title image")
      .populate("courseId", "name description image sectionType categoryId")
      .populate("courseIds", "name description image sectionType categoryId")
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







// export async function UPDATE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       courseId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId);
//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     const finalCategoryId = categoryId || tuter.categoryId;
//     const finalCourseId = courseId || tuter.courseId;

//     if (!mongoose.Types.ObjectId.isValid(finalCategoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(finalCourseId)) {
//       return res.status(400).json({ msg: "Invalid courseId" });
//     }

//     const category = await CategorySchema.findById(finalCategoryId);
//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const course = await CourseSchema.findById(finalCourseId);
//     if (!course) {
//       return res.status(404).json({ msg: "Course not found" });
//     }

//     if (String(course.categoryId) !== String(finalCategoryId)) {
//       return res.status(400).json({
//         msg: "Selected course does not belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       const selectedSection = sectionType || tuter.sectionType;

//       if (!selectedSection || !["one_to_one", "batch"].includes(selectedSection)) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one or batch",
//         });
//       }

//       if (course.sectionType !== selectedSection) {
//         return res.status(400).json({
//           msg: "Selected course does not belong to selected section",
//         });
//       }

//       const selectedSyllabus = syllabus || tuter.syllabus;

//       if (!selectedSyllabus || !["state", "cbse", "icse"].includes(selectedSyllabus)) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus must be state, cbse or icse",
//         });
//       }

//       finalSectionType = selectedSection;
//       finalSyllabus = selectedSyllabus;
//     }

//     if (name !== undefined) tuter.name = name.trim();
//     if (email !== undefined) tuter.email = email.trim().toLowerCase();
//     if (phone !== undefined) tuter.phone = phone.trim();
//     if (qualification !== undefined) tuter.qualification = qualification.trim();
//     if (about !== undefined) tuter.about = about.trim();
//     if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

//     tuter.categoryId = finalCategoryId;
//     tuter.courseId = finalCourseId;
//     tuter.sectionType = finalSectionType;
//     tuter.syllabus = finalSyllabus;

//     if (isActive !== undefined) {
//       tuter.isActive = isActive === "true" || isActive === true;
//     }

//     if (req.file) {
//       if (
//         tuter.photo &&
//         !String(tuter.photo).startsWith("http") &&
//         fs.existsSync(tuter.photo)
//       ) {
//         fs.unlinkSync(tuter.photo);
//       }

//       tuter.photo = getUploadedFileUrl(req.file);
//     }

//     await tuter.save();

//     return res.status(200).json({
//       msg: "Tuter updated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("UPDATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }
























// export async function UPDATE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     const finalCategoryId = categoryId || tuter.categoryId;

//     const incomingCourseIds = parseCourseIds(req.body);

//     const existingCourseIds =
//       Array.isArray(tuter.courseIds) && tuter.courseIds.length
//         ? tuter.courseIds.map((id) => String(id))
//         : tuter.courseId
//         ? [String(tuter.courseId)]
//         : [];

//     const finalCourseIds = incomingCourseIds.length
//       ? incomingCourseIds
//       : existingCourseIds;

//     if (!mongoose.Types.ObjectId.isValid(finalCategoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!finalCourseIds.length || !hasValidObjectIds(finalCourseIds)) {
//       return res.status(400).json({ msg: "Invalid courseIds" });
//     }

//     const category = await CategorySchema.findById(finalCategoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: finalCourseIds },
//     });

//     if (courses.length !== finalCourseIds.length) {
//       return res.status(404).json({ msg: "One or more courses not found" });
//     }

//     const invalidCategoryCourse = courses.find(
//       (course) => String(course.categoryId) !== String(finalCategoryId)
//     );

//     if (invalidCategoryCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       const selectedSection = sectionType || tuter.sectionType;

//       if (
//         !selectedSection ||
//         !["one_to_one", "batch", "both"].includes(selectedSection)
//       ) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one, batch or both",
//         });
//       }

//       if (selectedSection !== "both") {
//         const invalidSectionCourse = courses.find(
//           (course) => course.sectionType !== selectedSection
//         );

//         if (invalidSectionCourse) {
//           return res.status(400).json({
//             msg: "Selected courses do not belong to selected section",
//           });
//         }
//       }

//       if (selectedSection === "both") {
//         const invalidBothCourse = courses.find(
//           (course) =>
//             course.sectionType !== "one_to_one" &&
//             course.sectionType !== "batch"
//         );

//         if (invalidBothCourse) {
//           return res.status(400).json({
//             msg: "For both, select only one-to-one or batch courses",
//           });
//         }
//       }

//       const selectedSyllabus = syllabus || tuter.syllabus;

//       if (
//         !selectedSyllabus ||
//         !["state", "cbse", "icse"].includes(selectedSyllabus)
//       ) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus must be state, cbse or icse",
//         });
//       }

//       finalSectionType = selectedSection;
//       finalSyllabus = selectedSyllabus;
//     }

//     if (name !== undefined) tuter.name = name.trim();
//     if (email !== undefined) tuter.email = email.trim().toLowerCase();
//     if (phone !== undefined) tuter.phone = phone.trim();
//     if (qualification !== undefined) tuter.qualification = qualification.trim();
//     if (about !== undefined) tuter.about = about.trim();
//     if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

//     tuter.categoryId = finalCategoryId;
//     tuter.courseId = finalCourseIds[0];
//     tuter.courseIds = finalCourseIds;
//     tuter.sectionType = finalSectionType;
//     tuter.syllabus = finalSyllabus;

//     if (isActive !== undefined) {
//       tuter.isActive = isActive === "true" || isActive === true;
//     }

//     if (req.file) {
//       if (
//         tuter.photo &&
//         !String(tuter.photo).startsWith("http") &&
//         fs.existsSync(tuter.photo)
//       ) {
//         fs.unlinkSync(tuter.photo);
//       }

//       tuter.photo = getUploadedFileUrl(req.file);
//     }

//     await tuter.save();

//     return res.status(200).json({
//       msg: "Tuter updated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("UPDATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }











// export async function UPDATE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       categoryId,
//       sectionType,
//       syllabus,
//       isActive,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     const finalCategoryId = categoryId || tuter.categoryId;

//     const incomingCourseIds = parseCourseIds(req.body);

//     const existingCourseIds =
//       Array.isArray(tuter.courseIds) && tuter.courseIds.length
//         ? tuter.courseIds.map((id) => String(id))
//         : tuter.courseId
//         ? [String(tuter.courseId)]
//         : [];

//     const finalCourseIds = incomingCourseIds.length
//       ? incomingCourseIds
//       : existingCourseIds;

//     if (!mongoose.Types.ObjectId.isValid(finalCategoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     if (!finalCourseIds.length || !hasValidObjectIds(finalCourseIds)) {
//       return res.status(400).json({ msg: "Invalid courseIds" });
//     }

//     const category = await CategorySchema.findById(finalCategoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: finalCourseIds },
//     });

//     if (courses.length !== finalCourseIds.length) {
//       return res.status(404).json({ msg: "One or more courses not found" });
//     }

//     const invalidCategoryCourse = courses.find(
//       (course) => String(course.categoryId) !== String(finalCategoryId)
//     );

//     if (invalidCategoryCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected category",
//       });
//     }

//     let finalSectionType = "none";
//     let finalSyllabus = "none";

//     if (category.key === "online_tuition") {
//       const selectedSection = sectionType || tuter.sectionType;

//       if (
//         !selectedSection ||
//         !["one_to_one", "batch", "both"].includes(selectedSection)
//       ) {
//         return res.status(400).json({
//           msg: "For Online Tuition, sectionType must be one_to_one, batch or both",
//         });
//       }

//       if (selectedSection !== "both") {
//         const invalidSectionCourse = courses.find(
//           (course) => course.sectionType !== selectedSection
//         );

//         if (invalidSectionCourse) {
//           return res.status(400).json({
//             msg: "Selected courses do not belong to selected section",
//           });
//         }
//       }

//       if (selectedSection === "both") {
//         const invalidBothCourse = courses.find(
//           (course) =>
//             course.sectionType !== "one_to_one" &&
//             course.sectionType !== "batch"
//         );

//         if (invalidBothCourse) {
//           return res.status(400).json({
//             msg: "For both, select only one-to-one or batch courses",
//           });
//         }
//       }

//       const selectedSyllabus =
//         syllabus !== undefined ? String(syllabus).trim() : String(tuter.syllabus || "").trim();

//       if (!selectedSyllabus || selectedSyllabus === "none") {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus is required",
//         });
//       }

//       finalSectionType = selectedSection;
//       finalSyllabus = selectedSyllabus;
//     }

//     if (name !== undefined) tuter.name = name.trim();
//     if (email !== undefined) tuter.email = email.trim().toLowerCase();
//     if (phone !== undefined) tuter.phone = phone.trim();
//     if (qualification !== undefined) tuter.qualification = qualification.trim();
//     if (about !== undefined) tuter.about = about.trim();
//     if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

//     tuter.categoryId = finalCategoryId;
//     tuter.courseId = finalCourseIds[0];
//     tuter.courseIds = finalCourseIds;
//     tuter.sectionType = finalSectionType;
//     tuter.syllabus = finalSyllabus;

//     if (isActive !== undefined) {
//       tuter.isActive = isActive === "true" || isActive === true;
//     }

//     if (req.file) {
//       if (
//         tuter.photo &&
//         !String(tuter.photo).startsWith("http") &&
//         fs.existsSync(tuter.photo)
//       ) {
//         fs.unlinkSync(tuter.photo);
//       }

//       tuter.photo = getUploadedFileUrl(req.file);
//     }

//     await tuter.save();

//     return res.status(200).json({
//       msg: "Tuter updated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("UPDATE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }










// export async function UPDATE_TUTER(req,res){

// try{

// const{tuterId}=req.params;

// if(
// !mongoose.Types.ObjectId
// .isValid(tuterId)
// ){
// return res.status(400).json({
// msg:"Invalid tutor"
// });
// }

// const tuter=
// await TuterSchema.findById(
// tuterId
// );

// if(!tuter){
// return res.status(404).json({
// msg:"Tutor not found"
// });
// }

// const incomingCategoryIds=
// parseCategoryIds(req.body);

// const existingCategoryIds=
// Array.isArray(
// tuter.categoryIds
// )
// &&
// tuter.categoryIds.length
// ?
// tuter.categoryIds.map(
// id=>String(id)
// )
// :
// [String(tuter.categoryId)];

// const finalCategoryIds=
// incomingCategoryIds.length
// ?
// incomingCategoryIds
// :
// existingCategoryIds;

// const incomingCourseIds=
// parseCourseIds(req.body);

// const existingCourseIds=
// Array.isArray(
// tuter.courseIds
// )
// &&
// tuter.courseIds.length
// ?
// tuter.courseIds.map(
// id=>String(id)
// )
// :
// [String(tuter.courseId)];

// const finalCourseIds=
// incomingCourseIds.length
// ?
// incomingCourseIds
// :
// existingCourseIds;

// if(
// !hasValidObjectIds(
// finalCategoryIds
// )
// ){
// return res.status(400).json({
// msg:"Invalid categories"
// });
// }

// if(
// !hasValidObjectIds(
// finalCourseIds
// )
// ){
// return res.status(400).json({
// msg:"Invalid courses"
// });
// }

// const categories=
// await CategorySchema.find({
// _id:{
// $in:finalCategoryIds
// }
// });

// const courses=
// await CourseSchema.find({
// _id:{
// $in:finalCourseIds
// }
// });

// const invalidCourse=
// courses.find(
// course=>
// !finalCategoryIds.includes(
// String(course.categoryId)
// )
// );

// if(invalidCourse){
// return res.status(400).json({
// msg:"Course/category mismatch"
// });
// }

// const hasOnline=
// categories.some(
// cat=>
// cat.key==="online_tuition"
// );

// let finalSyllabus="none";

// let finalSectionType="none";

// if(hasOnline){

// const selectedSyllabus=
// req.body.syllabus
// ??
// tuter.syllabus;

// if(
// !selectedSyllabus ||
// selectedSyllabus==="none"
// ){
// return res.status(400).json({
// msg:"Syllabus required"
// });
// }

// finalSyllabus=
// String(
// selectedSyllabus
// ).trim();

// finalSectionType=
// "both";

// }

// if(req.body.name)
// tuter.name=req.body.name;

// if(req.body.email)
// tuter.email=
// req.body.email
// .toLowerCase();

// if(req.body.phone)
// tuter.phone=
// req.body.phone;

// if(req.body.about)
// tuter.about=
// req.body.about;

// if(req.body.qualification)
// tuter.qualification=
// req.body.qualification;

// if(req.body.subjects)
// tuter.subjects=
// parseSubjects(
// req.body.subjects
// );

// tuter.categoryId=
// finalCategoryIds[0];

// tuter.categoryIds=
// finalCategoryIds;

// tuter.courseId=
// finalCourseIds[0];

// tuter.courseIds=
// finalCourseIds;

// tuter.sectionType=
// finalSectionType;

// tuter.syllabus=
// finalSyllabus;

// if(
// req.file
// ){
// tuter.photo=
// getUploadedFileUrl(
// req.file
// );
// }

// await tuter.save();

// return res.status(200).json({
// msg:"Tutor updated",
// tuter
// });

// }
// catch(err){

// console.log(
// "UPDATE_TUTER",
// err.message
// );

// return res.status(500).json({
// error:err.message
// });

// }
// }



// export async function UPDATE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     const {
//       name,
//       email,
//       phone,
//       qualification,
//       about,
//       subjects,
//       syllabus,
//       isActive,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({
//         msg: "Invalid tuterId",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({
//         msg: "Tuter not found",
//       });
//     }

//     const incomingCategoryIds = parseCategoryIds(req.body);
//     const incomingCourseIds = parseCourseIds(req.body);

//     const existingCategoryIds =
//       Array.isArray(tuter.categoryIds) && tuter.categoryIds.length > 0
//         ? tuter.categoryIds.map(String)
//         : tuter.categoryId
//         ? [String(tuter.categoryId)]
//         : [];

//     const existingCourseIds =
//       Array.isArray(tuter.courseIds) && tuter.courseIds.length > 0
//         ? tuter.courseIds.map(String)
//         : tuter.courseId
//         ? [String(tuter.courseId)]
//         : [];

//     const finalCategoryIds =
//       incomingCategoryIds.length > 0 ? incomingCategoryIds : existingCategoryIds;

//     const finalCourseIds =
//       incomingCourseIds.length > 0 ? incomingCourseIds : existingCourseIds;

//     if (!finalCategoryIds.length) {
//       return res.status(400).json({
//         msg: "At least one category is required",
//       });
//     }

//     if (!finalCourseIds.length) {
//       return res.status(400).json({
//         msg: "At least one course is required",
//       });
//     }

//     if (!hasValidObjectIds(finalCategoryIds)) {
//       return res.status(400).json({
//         msg: "Invalid categoryIds",
//       });
//     }

//     if (!hasValidObjectIds(finalCourseIds)) {
//       return res.status(400).json({
//         msg: "Invalid courseIds",
//       });
//     }

//     const categories = await CategorySchema.find({
//       _id: { $in: finalCategoryIds },
//     });

//     if (categories.length !== finalCategoryIds.length) {
//       return res.status(404).json({
//         msg: "One or more categories not found",
//       });
//     }

//     const courses = await CourseSchema.find({
//       _id: { $in: finalCourseIds },
//     });

//     if (courses.length !== finalCourseIds.length) {
//       return res.status(404).json({
//         msg: "One or more courses not found",
//       });
//     }

//     const selectedCategorySet = new Set(finalCategoryIds.map(String));

//     const invalidCourse = courses.find((course) => {
//       return !selectedCategorySet.has(String(course.categoryId));
//     });

//     if (invalidCourse) {
//       return res.status(400).json({
//         msg: "Selected courses must belong to selected categories",
//       });
//     }

//     const hasOnlineTuition = categories.some(
//       (cat) => cat.key === "online_tuition"
//     );

//     let finalSyllabus = "none";
//     let finalSectionType = "none";

//     if (hasOnlineTuition) {
//       const selectedSyllabus =
//         syllabus !== undefined ? syllabus : tuter.syllabus;

//       if (!selectedSyllabus || !String(selectedSyllabus).trim()) {
//         return res.status(400).json({
//           msg: "For Online Tuition, syllabus is required",
//         });
//       }

//       finalSyllabus = String(selectedSyllabus).trim();
//       finalSectionType = "both";
//     }

//     if (name !== undefined) tuter.name = String(name).trim();
//     if (email !== undefined) tuter.email = String(email).trim().toLowerCase();
//     if (phone !== undefined) tuter.phone = String(phone).trim();
//     if (qualification !== undefined) {
//       tuter.qualification = String(qualification).trim();
//     }
//     if (about !== undefined) tuter.about = String(about).trim();
//     if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

//     tuter.categoryId = finalCategoryIds[0];
//     tuter.categoryIds = finalCategoryIds;

//     tuter.courseId = finalCourseIds[0];
//     tuter.courseIds = finalCourseIds;

//     tuter.sectionType = finalSectionType;
//     tuter.syllabus = finalSyllabus;

//     if (isActive !== undefined) {
//       tuter.isActive = isActive === "true" || isActive === true;
//     }

//     if (req.file) {
//       if (
//         tuter.photo &&
//         !String(tuter.photo).startsWith("http") &&
//         fs.existsSync(tuter.photo)
//       ) {
//         fs.unlinkSync(tuter.photo);
//       }

//       tuter.photo = getUploadedFileUrl(req.file);
//     }

//     await tuter.save();

//     return res.status(200).json({
//       msg: "Tuter updated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("UPDATE_TUTER error:", err.message);
//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }










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

    const categoryIds = parseCategoryIds(req.body).length
      ? parseCategoryIds(req.body)
      : tuter.categoryIds?.length
      ? tuter.categoryIds.map(String)
      : [String(tuter.categoryId)];

    const courseIds = parseCourseIds(req.body).length
      ? parseCourseIds(req.body)
      : tuter.courseIds?.length
      ? tuter.courseIds.map(String)
      : [String(tuter.courseId)];

    if (!hasValidObjectIds(categoryIds)) {
      return res.status(400).json({ msg: "Invalid categoryIds" });
    }

    if (!hasValidObjectIds(courseIds)) {
      return res.status(400).json({ msg: "Invalid courseIds" });
    }

    const categories = await CategorySchema.find({
      _id: { $in: categoryIds },
    });

    if (categories.length !== categoryIds.length) {
      return res.status(404).json({ msg: "One or more categories not found" });
    }

    const courses = await CourseSchema.find({
      _id: { $in: courseIds },
    });

    if (courses.length !== courseIds.length) {
      return res.status(404).json({ msg: "One or more courses not found" });
    }

    const allowedCategorySet = new Set(categoryIds.map(String));

    const invalidCourse = courses.find(
      (course) => !allowedCategorySet.has(String(course.categoryId))
    );

    if (invalidCourse) {
      return res.status(400).json({
        msg: "Selected courses must belong to selected category",
      });
    }

    const onlineCategory = categories.find((cat) => cat.key === "online_tuition");

    let finalSyllabus = "none";
    let finalSectionType = "none";

    if (onlineCategory) {
      const selectedSyllabus =
        syllabus !== undefined ? String(syllabus).trim() : String(tuter.syllabus || "").trim();

      if (!selectedSyllabus || selectedSyllabus === "none") {
        return res.status(400).json({
          msg: "For Online Tuition, syllabus is required",
        });
      }

      finalSyllabus = selectedSyllabus;

      const onlineCourseSections = courses
        .filter((course) => String(course.categoryId) === String(onlineCategory._id))
        .map((course) => course.sectionType);

      if (
        onlineCourseSections.includes("one_to_one") &&
        onlineCourseSections.includes("batch")
      ) {
        finalSectionType = "both";
      } else if (onlineCourseSections.includes("one_to_one")) {
        finalSectionType = "one_to_one";
      } else if (onlineCourseSections.includes("batch")) {
        finalSectionType = "batch";
      } else {
        finalSectionType = "none";
      }
    }

    const cleanEmail =
      email !== undefined ? String(email).toLowerCase().trim() : tuter.email;

    const cleanPhone =
      phone !== undefined ? String(phone).trim() : tuter.phone;

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          msg: "Please enter a valid tutor email address",
        });
      }

      const existingEmailUser = await UserSchema.findOne({
        email: cleanEmail,
        _id: { $ne: tuter.loginUserId },
      });

      if (existingEmailUser) {
        return res.status(409).json({
          msg: "Tutor email already exists",
        });
      }
    }

    if (cleanPhone) {
      const existingPhoneUser = await UserSchema.findOne({
        phone: cleanPhone,
        _id: { $ne: tuter.loginUserId },
      });

      if (existingPhoneUser) {
        return res.status(409).json({
          msg: "Tutor phone already exists",
        });
      }
    }

    if (name !== undefined) tuter.name = String(name).trim();
    if (email !== undefined) tuter.email = cleanEmail;
    if (phone !== undefined) tuter.phone = cleanPhone;
    if (qualification !== undefined) tuter.qualification = String(qualification).trim();
    if (about !== undefined) tuter.about = String(about).trim();
    if (subjects !== undefined) tuter.subjects = parseSubjects(subjects);

    tuter.categoryId = categoryIds[0];
    tuter.categoryIds = categoryIds;
    tuter.courseId = courseIds[0];
    tuter.courseIds = courseIds;
    tuter.sectionType = finalSectionType;
    tuter.syllabus = finalSyllabus;

    if (isActive !== undefined) {
      tuter.isActive = isActive === "true" || isActive === true;
    }

    if (req.file) {
      tuter.photo = getUploadedFileUrl(req.file);
    }

    await tuter.save();

    if (tuter.loginUserId) {
      await UserSchema.findByIdAndUpdate(tuter.loginUserId, {
        name: tuter.name,
        email: tuter.email,
        phone: tuter.phone,
        photo: tuter.photo,
        isActive: tuter.isActive,
      });
    }

    return res.status(200).json({
      msg: "Tuter updated successfully",
      tuter,
    });
  } catch (err) {
    console.log("UPDATE_TUTER error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}







// // admin delete tuter
// export async function DELETE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId);



// if (tuter.loginUserId) {
//   await UserSchema.findByIdAndDelete(tuter.loginUserId);
// }


//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     if (
//       tuter.photo &&
//       !String(tuter.photo).startsWith("http") &&
//       fs.existsSync(tuter.photo)
//     ) {
//       fs.unlinkSync(tuter.photo);
//     }

//     await TuterReviewSchema.deleteMany({ tuterId });
//     await TuterSchema.findByIdAndDelete(tuterId);

//     return res.status(200).json({
//       msg: "Tuter deleted successfully",
//       deletedTuter: tuter,
//     });
//   } catch (err) {
//     console.log("DELETE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }














// // admin delete tuter
// export async function DELETE_TUTER(req, res) {
//   try {
//     const { tuterId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     if (
//       tuter.photo &&
//       !String(tuter.photo).startsWith("http") &&
//       fs.existsSync(tuter.photo)
//     ) {
//       fs.unlinkSync(tuter.photo);
//     }

//     await TuterReviewSchema.deleteMany({ tuterId });

//     if (tuter.loginUserId) {
//       await UserSchema.findByIdAndDelete(tuter.loginUserId);
//     }

//     await TuterSchema.findByIdAndDelete(tuterId);

//     return res.status(200).json({
//       msg: "Tuter deleted successfully",
//       deletedTuter: tuter,
//     });
//   } catch (err) {
//     console.log("DELETE_TUTER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }










// admin delete tuter
export async function DELETE_TUTER(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({
        msg: "Invalid tuterId",
      });
    }

    const tuter = await TuterSchema.findById(tuterId);

    if (!tuter) {
      return res.status(404).json({
        msg: "Tuter not found",
      });
    }

    if (tuter.loginUserId) {
      await UserSchema.findByIdAndDelete(tuter.loginUserId);
    }

    if (
      tuter.photo &&
      !String(tuter.photo).startsWith("http") &&
      fs.existsSync(tuter.photo)
    ) {
      fs.unlinkSync(tuter.photo);
    }

    await TuterReviewSchema.deleteMany({ tuterId });
    await StudentTutorAssignSchema.deleteMany({ tuterId });
    await TuterSchema.findByIdAndDelete(tuterId);

    return res.status(200).json({
      msg: "Tuter deleted successfully",
      deletedTuter: tuter,
    });
  } catch (err) {
    console.log("DELETE_TUTER error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
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






// // student get all active tuters
// export async function GET_ALL_TUTERS_USER(req, res) {
//   try {
//     const tuters = await TuterSchema.find({ isActive: true })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "All active tutors fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_ALL_TUTERS_USER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }














// export async function GET_ALL_TUTERS_USER(req, res) {
//   try {
//     const tuters = await TuterSchema.find({ isActive: true })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType categoryId")
//       .populate("courseIds", "name description image sectionType categoryId")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "All active tutors fetched successfully",
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_ALL_TUTERS_USER error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }



export async function GET_ALL_TUTERS_USER(req, res) {
  try {
    const tuters = await TuterSchema.find({ isActive: true })
      .populate("categoryId", "key title image")
      .populate("categoryIds", "key title image")
      .populate("courseId", "name description image sectionType categoryId")
      .populate("courseIds", "name description image sectionType categoryId")
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




// // student get tuters by category
// export async function GET_TUTERS_BY_CATEGORY(req, res) {
//   try {
//     const { categoryId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     const category = await CategorySchema.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const tuters = await TuterSchema.find({
//       categoryId,
//       isActive: true,
//     })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "Tutors fetched by category successfully",
//       category,
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_TUTERS_BY_CATEGORY error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }


















// export async function GET_TUTERS_BY_CATEGORY(req, res) {
//   try {
//     const { categoryId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({ msg: "Invalid categoryId" });
//     }

//     const category = await CategorySchema.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ msg: "Category not found" });
//     }

//     const tuters = await TuterSchema.find({
//       categoryId,
//       isActive: true,
//     })
//       .populate("categoryId", "key title image")
//       .populate("courseId", "name description image sectionType categoryId")
//       .populate("courseIds", "name description image sectionType categoryId")
//       .sort({ createdAt: -1 });

//     const data = await Promise.all(
//       tuters.map((tuter) => attachRatingAndReviews(tuter))
//     );

//     return res.status(200).json({
//       msg: "Tutors fetched by category successfully",
//       category,
//       count: data.length,
//       tuters: data,
//     });
//   } catch (err) {
//     console.log("GET_TUTERS_BY_CATEGORY error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }








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
      isActive: true,
      $or: [
        { categoryId },
        { categoryIds: { $in: [categoryId] } },
      ],
    })
      .populate("categoryId", "key title image")
      .populate("categoryIds", "key title image")
      .populate("courseId", "name description image sectionType categoryId")
      .populate("courseIds", "name description image sectionType categoryId")
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







// export async function DELETE_STUDENT_ADMIN(req, res) {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ msg: "Invalid userId" });
//     }

//     const user = await UserSchema.findOne({
//       _id: userId,
//       role: "student",
//     });

//     if (!user) {
//       return res.status(404).json({ msg: "Student not found" });
//     }

//     await UserSchema.findByIdAndDelete(userId);

//     return res.status(200).json({
//       msg: "Student deleted successfully",
//       deletedUser: user,
//     });
//   } catch (err) {
//     console.log("DELETE_USER_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }









// admin delete student
export async function DELETE_STUDENT_ADMIN(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        msg: "Invalid student id",
      });
    }

    const student = await UserSchema.findOne({
      _id: userId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    await FeedbackSchema.deleteMany({ studentId: userId });
    await TuterReviewSchema.deleteMany({ studentId: userId });
    await StudentTutorAssignSchema.deleteMany({ studentId: userId });
    await ChatMessageSchema.deleteMany({ senderId: userId });
    await ChatRoomSchema.deleteMany({
      $or: [{ studentId: userId }, { adminId: userId }],
    });

    await UserSchema.findByIdAndDelete(userId);

    return res.status(200).json({
      msg: "Student deleted successfully",
      deletedStudent: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
      },
    });
  } catch (err) {
    console.log("DELETE_STUDENT_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}



// // admin active / deactive tuter
// export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
//   try {
//     const { tuterId } = req.params;
//     const { isActive } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     if (isActive === undefined) {
//       return res.status(400).json({
//         msg: "isActive is required. Send true or false",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     tuter.isActive = isActive === true || isActive === "true";


//     if (tuter.loginUserId) {
//   await UserSchema.findByIdAndUpdate(tuter.loginUserId, {
//     isActive: tuter.isActive,
//   });
// }

//     await tuter.save();

//     return res.status(200).json({
//       msg: tuter.isActive
//         ? "Tuter activated successfully"
//         : "Tuter deactivated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("TOGGLE_TUTER_STATUS_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }



// // admin active / deactive tuter
// export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
//   try {
//     const { tuterId } = req.params;
//     const { isActive } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     if (isActive === undefined) {
//       return res.status(400).json({
//         msg: "isActive is required. Send true or false",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({ msg: "Tuter not found" });
//     }

//     tuter.isActive = isActive === true || isActive === "true";

//     await tuter.save();

//     if (tuter.loginUserId) {
//       await UserSchema.findByIdAndUpdate(tuter.loginUserId, {
//         isActive: tuter.isActive,
//       });
//     }

//     return res.status(200).json({
//       msg: tuter.isActive
//         ? "Tuter activated successfully"
//         : "Tuter deactivated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("TOGGLE_TUTER_STATUS_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }










// // admin active / deactive tuter
// export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
//   try {
//     const { tuterId } = req.params;
//     const { isActive } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({
//         msg: "Invalid tuterId",
//       });
//     }

//     if (isActive === undefined) {
//       return res.status(400).json({
//         msg: "isActive is required. Send true or false",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({
//         msg: "Tuter not found",
//       });
//     }

//     // ✅ This is only for showing / hiding tutor profile from students
//     // ✅ Do NOT block tutor login user here
//     tuter.isActive = isActive === true || isActive === "true";

//     await tuter.save();

//     return res.status(200).json({
//       msg: tuter.isActive
//         ? "Tuter activated successfully"
//         : "Tuter deactivated successfully. Tutor can still login, but profile is hidden from students.",
//       tuter,
//     });
//   } catch (err) {
//     console.log("TOGGLE_TUTER_STATUS_ADMIN error:", err.message);

//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }



// // admin active / deactive tuter
// export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
//   try {
//     const { tuterId } = req.params;
//     const { isActive } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({
//         msg: "Invalid tuterId",
//       });
//     }

//     if (isActive === undefined) {
//       return res.status(400).json({
//         msg: "isActive is required. Send true or false",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({
//         msg: "Tuter not found",
//       });
//     }

//     // ✅ deactivate only hides tutor profile from students
//     // ✅ tutor login should NOT be blocked here
//     tuter.isActive = isActive === true || isActive === "true";

//     await tuter.save();

//     return res.status(200).json({
//       msg: tuter.isActive
//         ? "Tuter activated successfully"
//         : "Tuter deactivated successfully",
//       tuter,
//     });
//   } catch (err) {
//     console.log("TOGGLE_TUTER_STATUS_ADMIN error:", err.message);

//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }








export async function TOGGLE_TUTER_STATUS_ADMIN(req, res) {
  try {
    const { tuterId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        msg: "isActive is required",
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
// export async function INVITE_STUDENT_ADMIN(req, res) {
//   try {
//     const { name, email, phone } = req.body;

//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         msg: "name, email and phone are required",
//       });
//     }

//     const cleanName = name.trim();
//     const cleanEmail = email.toLowerCase().trim();
//     const cleanPhone = String(phone).trim();

//     const existingUser = await UserSchema.findOne({
//       $or: [{ email: cleanEmail }, { phone: cleanPhone }],
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         msg:
//           existingUser.email === cleanEmail
//             ? "Student already registered with this email"
//             : "Student already registered with this phone number",
//       });
//     }

//     const tempPassword = makeInvitePassword();
//     const hashedPassword = await bcrypt.hash(tempPassword, 10);

//     const inviteToken = jwt.sign(
//       {
//         type: "student_invite",
//         name: cleanName,
//         email: cleanEmail,
//         phone: cleanPhone,
//         tempPass: tempPassword,
//       },
//       process.env.JWT_TOKEN,
//       { expiresIn: "7d" }
//     );

//     const inviteLink = `${
//       process.env.FRONTEND_URL || "http://localhost:5173"
//     }/invite-login?token=${encodeURIComponent(inviteToken)}`;

//     const student = await UserSchema.create({
//       name: cleanName,
//       email: cleanEmail,
//       phone: cleanPhone,
//       pass: hashedPassword,
//       role: "student",
//       isActive: true,
//       invitedBy: req.user._id,
//       inviteTokenHash: hashInviteToken(inviteToken),
//       inviteTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       inviteAcceptedAt: null,
//     });

//     await sendStudentInviteMail({
//       to: cleanEmail,
//       name: cleanName,
//       inviteLink,
//     });

//     return res.status(201).json({
//       msg: "Student invited successfully",
//       student: {
//         id: student._id,
//         name: student.name,
//         email: student.email,
//         phone: student.phone,
//         role: student.role,
//         isActive: student.isActive,
//         inviteTokenExpires: student.inviteTokenExpires,
//       },

//       // development testing only
//       inviteLink,
//       tempPassword,
//     });
//   } catch (err) {
//     console.log("INVITE_STUDENT_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }

























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

    let mailSent = true;
    let mailErrorMessage = null;

    try {
      await sendStudentInviteMail({
        to: cleanEmail,
        name: cleanName,
        inviteLink,
      });
    } catch (mailError) {
      mailSent = false;
      mailErrorMessage = mailError.message;
      console.log("Invite mail failed:", mailError.message);
    }

    return res.status(201).json({
      msg: mailSent
        ? "Student invited successfully"
        : "Student created, but invite mail failed",
      mailSent,
      mailError: mailErrorMessage,
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

    const files = req.files.map((file) => {
      const fileUrl = getUploadedFileUrl(file);

      return {
        originalName: file.originalname,
        fileName: getUploadedFileName(file),
        path: fileUrl,
        url: fileUrl,
        mimeType: file.mimetype,
        size: file.size,
        fileType: getChatFileType(file.mimetype),
      };
    });

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







// //website feedback


// export async function ADD_FEEDBACK(req, res) {
//   try {
//     const { rating, message } = req.body;

//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({
//         msg: "Rating must be between 1 and 5",
//       });
//     }

//     if (!message || !message.trim()) {
//       return res.status(400).json({
//         msg: "Feedback message is required",
//       });
//     }

//     const feedback = await FeedbackSchema.findOneAndUpdate(
//       { studentId: req.user._id },
//       {
//         rating: Number(rating),
//         message: message.trim(),
//       },
//       {
//         new: true,
//         upsert: true,
//       }
//     ).populate("studentId", "name email photo");

//     return res.status(200).json({
//       msg: "Feedback submitted successfully",
//       feedback,
//     });
//   } catch (err) {
//     console.log("ADD_FEEDBACK error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }









export async function ADD_FEEDBACK(req, res) {
  try {
    const { rating, message } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        msg: "Rating must be between 1 and 5",
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        msg: "Feedback message is required",
      });
    }

    const feedback = await FeedbackSchema.findOneAndUpdate(
      { studentId: req.user._id },
      {
        studentId: req.user._id,
        rating: Number(rating),
        message: String(message).trim(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate("studentId", "name email photo role isActive");

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

// export async function GET_ALL_FEEDBACK(req, res) {
//   try {
//     const feedbacks = await FeedbackSchema.find()
//       .populate("studentId", "name email photo")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       msg: "All feedback fetched successfully",
//       count: feedbacks.length,
//       feedbacks,
//     });
//   } catch (err) {
//     console.log("GET_ALL_FEEDBACK_ADMIN error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }
















export async function GET_ALL_FEEDBACK(req, res) {
  try {
    const feedbacks = await FeedbackSchema.find()
      .populate("studentId", "name email photo role isActive")
      .sort({ createdAt: -1 });

    // deleted student / inactive student / non-student feedback hide cheyyum
    const cleanFeedbacks = feedbacks.filter((feedback) => {
      const student = feedback.studentId;

      if (!student) return false;
      if (student.role !== "student") return false;
      if (student.isActive === false) return false;

      return true;
    });

    return res.status(200).json({
      msg: "All feedback fetched successfully",
      count: cleanFeedbacks.length,
      feedbacks: cleanFeedbacks,
    });
  } catch (err) {
    console.log("GET_ALL_FEEDBACK error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}














//get may feedback

// export async function GET_MY_FEEDBACK(req, res) {
//   try {
//     const feedback = await FeedbackSchema.findOne({
//       studentId: req.user._id,
//     }).populate("studentId", "name email photo");

//     return res.status(200).json({
//       msg: "My feedback fetched successfully",
//       feedback,
//     });
//   } catch (err) {
//     console.log("GET_MY_FEEDBACK error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }



export async function GET_MY_FEEDBACK(req, res) {
  try {
    const feedback = await FeedbackSchema.findOne({
      studentId: req.user._id,
    }).populate("studentId", "name email photo role isActive");

    return res.status(200).json({
      msg: "My feedback fetched successfully",
      feedback,
    });
  } catch (err) {
    console.log("GET_MY_FEEDBACK error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}







export async function DELETE_MY_FEEDBACK(req, res) {
  try {
    const feedback = await FeedbackSchema.findOneAndDelete({
      studentId: req.user._id,
    });

    if (!feedback) {
      return res.status(404).json({
        msg: "No feedback found to delete",
      });
    }

    return res.status(200).json({
      msg: "Feedback deleted successfully",
      deletedFeedbackId: feedback._id,
    });
  } catch (err) {
    console.log("DELETE_MY_FEEDBACK error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}






























// ================= ASSIGN TUTORS TO STUDENT =================

export async function ASSIGN_TUTORS_TO_STUDENT(req, res) {
  try {
    const { studentId } = req.params;
    const { tutorIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        msg: "Invalid studentId",
      });
    }

    if (!Array.isArray(tutorIds)) {
      return res.status(400).json({
        msg: "tutorIds must be array",
      });
    }

    const validTutorIds = tutorIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const student = await UserSchema.findById(studentId);

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    const tutors = await TuterSchema.find({
      _id: { $in: validTutorIds },
    });

    if (tutors.length !== validTutorIds.length) {
      return res.status(404).json({
        msg: "One or more tutors not found",
      });
    }

    let assignment = await StudentTutorAssignSchema.findOne({
      studentId,
    });

    if (assignment) {
      assignment.tutorIds = validTutorIds;
      assignment.assignedBy = req.user._id;

      await assignment.save();
    } else {
      assignment = await StudentTutorAssignSchema.create({
        studentId,
        tutorIds: validTutorIds,
        assignedBy: req.user._id,
      });
    }

    return res.status(200).json({
      msg: "Tutors assigned successfully",
      assignment,
    });
  } catch (err) {
    console.log("ASSIGN_TUTORS_TO_STUDENT error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
}

// ================= GET ASSIGNED TUTORS =================

export async function GET_ASSIGNED_TUTORS_BY_STUDENT(req, res) {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        msg: "Invalid studentId",
      });
    }

    const assignment = await StudentTutorAssignSchema.findOne({
      studentId,
    }).populate({
      path: "tutorIds",
      populate: [
        {
          path: "categoryId",
          select: "title key image",
        },
        {
          path: "courseIds",
          select: "name sectionType",
        },
      ],
    });

    return res.status(200).json({
      msg: "Assigned tutors fetched successfully",
      tutors: assignment ? assignment.tutorIds : [],
    });
  } catch (err) {
    console.log("GET_ASSIGNED_TUTORS_BY_STUDENT error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
}

// ================= GET ASSIGNED STUDENTS =================

export async function GET_ASSIGNED_STUDENTS_BY_TUTOR(req, res) {
  try {
    const { tuterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({
        msg: "Invalid tuterId",
      });
    }

    const assignments = await StudentTutorAssignSchema.find({
      tutorIds: tuterId,
    }).populate("studentId", "name email phone photo");

    const students = assignments.map((item) => item.studentId);

    return res.status(200).json({
      msg: "Assigned students fetched successfully",
      students,
    });
  } catch (err) {
    console.log("GET_ASSIGNED_STUDENTS_BY_TUTOR error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
}



























































// // ================= ASSIGN TUTORS TO STUDENT =================

// export async function ASSIGN_TUTORS_TO_STUDENT(req, res) {
//   try {
//     const { studentId } = req.params;
//     const { assignments } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({ msg: "Invalid studentId" });
//     }

//     if (!Array.isArray(assignments)) {
//       return res.status(400).json({
//         msg: "assignments must be array",
//       });
//     }

//     const student = await UserSchema.findById(studentId);

//     if (!student) {
//       return res.status(404).json({ msg: "Student not found" });
//     }

//     const cleanAssignments = [];

//     for (const item of assignments) {
//       const tutorId = item?.tutorId;
//       const courseIds = Array.isArray(item?.courseIds) ? item.courseIds : [];

//       if (!mongoose.Types.ObjectId.isValid(tutorId)) {
//         return res.status(400).json({ msg: "Invalid tutorId in assignments" });
//       }

//       if (courseIds.length === 0) {
//         return res.status(400).json({
//           msg: "Each selected tutor must have at least one selected course",
//         });
//       }

//       const validCourseIds = courseIds.filter((id) =>
//         mongoose.Types.ObjectId.isValid(id)
//       );

//       if (validCourseIds.length !== courseIds.length) {
//         return res.status(400).json({
//           msg: "Invalid courseId in assignments",
//         });
//       }

//       cleanAssignments.push({
//         tutorId,
//         courseIds: validCourseIds,
//       });
//     }

//     const tutorIds = cleanAssignments.map((item) => item.tutorId);

//     const tutors = await TuterSchema.find({
//       _id: { $in: tutorIds },
//     });

//     if (tutors.length !== tutorIds.length) {
//       return res.status(404).json({
//         msg: "One or more tutors not found",
//       });
//     }

//     const allCourseIds = cleanAssignments.flatMap((item) => item.courseIds);

//     const courses = await CourseSchema.find({
//       _id: { $in: allCourseIds },
//     });

//     if (courses.length !== [...new Set(allCourseIds.map(String))].length) {
//       return res.status(404).json({
//         msg: "One or more courses not found",
//       });
//     }

//     for (const item of cleanAssignments) {
//       const tutor = tutors.find(
//         (t) => String(t._id) === String(item.tutorId)
//       );

//       const tutorCourseIds =
//         Array.isArray(tutor.courseIds) && tutor.courseIds.length > 0
//           ? tutor.courseIds.map(String)
//           : tutor.courseId
//           ? [String(tutor.courseId)]
//           : [];

//       const invalidCourse = item.courseIds.find(
//         (courseId) => !tutorCourseIds.includes(String(courseId))
//       );

//       if (invalidCourse) {
//         return res.status(400).json({
//           msg: "Selected course does not belong to selected tutor",
//         });
//       }
//     }

//     let assignment = await StudentTutorAssignSchema.findOne({ studentId });

//     if (assignment) {
//       assignment.assignments = cleanAssignments;
//       assignment.assignedBy = req.user._id;
//       await assignment.save();
//     } else {
//       assignment = await StudentTutorAssignSchema.create({
//         studentId,
//         assignments: cleanAssignments,
//         assignedBy: req.user._id,
//       });
//     }

//     return res.status(200).json({
//       msg: "Tutors assigned successfully",
//       assignment,
//     });
//   } catch (err) {
//     console.log("ASSIGN_TUTORS_TO_STUDENT error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }

// // ================= GET ASSIGNED TUTORS =================

// export async function GET_ASSIGNED_TUTORS_BY_STUDENT(req, res) {
//   try {
//     const { studentId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({ msg: "Invalid studentId" });
//     }

//     const assignment = await StudentTutorAssignSchema.findOne({
//       studentId,
//     })
//       .populate({
//         path: "assignments.tutorId",
//         populate: [
//           {
//             path: "categoryId",
//             select: "title key image",
//           },
//           {
//             path: "courseId",
//             select: "name sectionType",
//           },
//           {
//             path: "courseIds",
//             select: "name sectionType",
//           },
//         ],
//       })
//       .populate({
//         path: "assignments.courseIds",
//         select: "name sectionType categoryId",
//       });

//     const assignments = assignment ? assignment.assignments : [];

//     const tutors = assignments
//       .map((item) => {
//         if (!item.tutorId) return null;

//         const tutorObj = item.tutorId.toObject
//           ? item.tutorId.toObject()
//           : item.tutorId;

//         return {
//           ...tutorObj,
//           assignedCourseIds: item.courseIds || [],
//         };
//       })
//       .filter(Boolean);

//     return res.status(200).json({
//       msg: "Assigned tutors fetched successfully",
//       assignments,
//       tutors,
//     });
//   } catch (err) {
//     console.log("GET_ASSIGNED_TUTORS_BY_STUDENT error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }

// // ================= GET ASSIGNED STUDENTS =================

// export async function GET_ASSIGNED_STUDENTS_BY_TUTOR(req, res) {
//   try {
//     const { tuterId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({ msg: "Invalid tuterId" });
//     }

//     const assignments = await StudentTutorAssignSchema.find({
//       "assignments.tutorId": tuterId,
//     })
//       .populate("studentId", "name email phone photo")
//       .populate({
//         path: "assignments.courseIds",
//         select: "name sectionType categoryId",
//       });

//     const students = assignments
//       .map((item) => {
//         const matchedAssignment = item.assignments.find(
//           (assign) => String(assign.tutorId) === String(tuterId)
//         );

//         if (!item.studentId) return null;

//         const studentObj = item.studentId.toObject
//           ? item.studentId.toObject()
//           : item.studentId;

//         return {
//           ...studentObj,
//           assignedCourses: matchedAssignment?.courseIds || [],
//         };
//       })
//       .filter(Boolean);

//     return res.status(200).json({
//       msg: "Assigned students fetched successfully",
//       students,
//     });
//   } catch (err) {
//     console.log("GET_ASSIGNED_STUDENTS_BY_TUTOR error:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }









































function generateTutorPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const symbols = "@#";

  const pick = (str) => str[Math.floor(Math.random() * str.length)];

  let pass = "";
  pass += pick(upper);
  pass += pick(lower);
  pass += pick(lower);
  pass += pick(nums);
  pass += pick(nums);
  pass += pick(symbols);

  const all = upper + lower + nums + symbols;

  while (pass.length < 8) {
    pass += pick(all);
  }

  return pass
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function parseArrayIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// function parseCategoryIds(body) {
//   return parseArrayIds(body.categoryIds || body.categoryId);
// }

// function parseCourseIds(body) {
//   return parseArrayIds(body.courseIds || body.courseId);
// }

// function parseSubjects(subjects) {
//   if (!subjects) return [];

//   if (Array.isArray(subjects)) {
//     return subjects.map((s) => String(s).trim()).filter(Boolean);
//   }

//   return String(subjects)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function hasValidObjectIds(ids) {
//   return Array.isArray(ids) && ids.every((id) => mongoose.Types.ObjectId.isValid(id));
// }

// function getUploadedFileUrl(file) {
//   if (!file) return "";
//   return String(file.secure_url || file.url || file.path || "").replace(/\\/g, "/");
// }












async function syncTutorVisiblePassword(user, newPassword) {
  if (!user || user.role !== "tutor") return;

  await TuterSchema.findOneAndUpdate(
    { loginUserId: user._id },
    {
      loginPasswordText: String(newPassword),
    },
    { new: true }
  );
}










//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// one-time fix: re-enable tutor login users
export async function RE_ENABLE_TUTOR_LOGIN_USERS(req, res) {
  try {
    const tutors = await TuterSchema.find({
      loginUserId: { $exists: true, $ne: null },
    });

    const loginUserIds = tutors
      .map((tutor) => tutor.loginUserId)
      .filter(Boolean);

    if (loginUserIds.length === 0) {
      return res.status(200).json({
        msg: "No tutor login users found",
        updatedCount: 0,
      });
    }

    const result = await UserSchema.updateMany(
      {
        _id: { $in: loginUserIds },
        role: "tutor",
      },
      {
        $set: { isActive: true },
      }
    );

    return res.status(200).json({
      msg: "Tutor login users re-enabled successfully",
      updatedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    console.log("RE_ENABLE_TUTOR_LOGIN_USERS error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////













//block tutor





// // admin block / unblock tutor login
// export async function TOGGLE_TUTER_BLOCK_STATUS_ADMIN(req, res) {
//   try {
//     const { tuterId } = req.params;
//     const { isBlocked } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(tuterId)) {
//       return res.status(400).json({
//         msg: "Invalid tuterId",
//       });
//     }

//     if (isBlocked === undefined) {
//       return res.status(400).json({
//         msg: "isBlocked is required. Send true or false",
//       });
//     }

//     const tuter = await TuterSchema.findById(tuterId);

//     if (!tuter) {
//       return res.status(404).json({
//         msg: "Tuter not found",
//       });
//     }

//     const finalBlocked = isBlocked === true || isBlocked === "true";

//     tuter.isBlocked = finalBlocked;

//     // ✅ Block means tutor cannot login
//     // ✅ Unblock means tutor can login again
//     if (tuter.loginUserId) {
//       await UserSchema.findByIdAndUpdate(tuter.loginUserId, {
//         isActive: !finalBlocked,
//       });
//     }

//     await tuter.save();

//     return res.status(200).json({
//       msg: finalBlocked
//         ? "Tuter blocked successfully. Tutor cannot login now."
//         : "Tuter unblocked successfully. Tutor can login now.",
//       tuter,
//     });
//   } catch (err) {
//     console.log("TOGGLE_TUTER_BLOCK_STATUS_ADMIN error:", err.message);

//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// }









export async function TOGGLE_TUTER_BLOCK_STATUS_ADMIN(req, res) {
  try {
    const { tuterId } = req.params;
    const { isBlocked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tuterId)) {
      return res.status(400).json({ msg: "Invalid tuterId" });
    }

    if (isBlocked === undefined) {
      return res.status(400).json({
        msg: "isBlocked is required",
      });
    }

    const tuter = await TuterSchema.findById(tuterId);

    if (!tuter) {
      return res.status(404).json({ msg: "Tuter not found" });
    }

    const finalBlocked = isBlocked === true || isBlocked === "true";

    tuter.isBlocked = finalBlocked;

    if (tuter.loginUserId) {
      await UserSchema.findByIdAndUpdate(tuter.loginUserId, {
        isBlocked: finalBlocked,
        isActive: !finalBlocked,
      });
    }

    await tuter.save();

    return res.status(200).json({
      msg: finalBlocked
        ? "Tuter blocked successfully"
        : "Tuter unblocked successfully",
      tuter,
    });
  } catch (err) {
    console.log("TOGGLE_TUTER_BLOCK_STATUS_ADMIN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}



















// export async function TOGGLE_STUDENT_BLOCK_STATUS_ADMIN(req,res){

// try{

// const {userId}=req.params;
// const {isBlocked}=req.body;

// if(
// !mongoose.Types.ObjectId.isValid(userId)
// ){
// return res.status(400).json({
// msg:"Invalid student id"
// });
// }

// const student=
// await UserSchema.findById(userId);

// if(!student){

// return res.status(404).json({
// msg:"Student not found"
// });

// }

// student.isBlocked=
// isBlocked===true ||
// isBlocked==="true";

// student.isActive=
// !student.isBlocked;

// await student.save();

// return res.status(200).json({

// msg:
// student.isBlocked
// ?
// "Student blocked successfully"
// :
// "Student unblocked successfully",

// student

// });

// }catch(err){

// console.log(err);

// return res.status(500).json({
// error:err.message
// })

// }

// }

































export async function TOGGLE_STUDENT_BLOCK_STATUS_ADMIN(req, res) {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        msg: "Invalid student id",
      });
    }

    const student = await UserSchema.findById(userId);

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    student.isBlocked = isBlocked === true || isBlocked === "true";

    await student.save();

    return res.status(200).json({
      msg: student.isBlocked
        ? "Student blocked successfully"
        : "Student unblocked successfully",
      student,
    });
  } catch (err) {
    console.log("TOGGLE_STUDENT_BLOCK_STATUS_ADMIN error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
}