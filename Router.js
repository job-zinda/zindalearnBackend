

import { Router } from "express";
import * as rh from "./Requesthandeler.js";
import Auth from "./Middleware/Auth.js";
import adminOnly from "./Middleware/adminOnly.js";
import bannerUpload from "./Middleware/bannerUpload.js";
import categoryUpload from "./Middleware/categoryUpload.js";
import courseUpload from "./Middleware/courseUpload.js";
import tuterUpload from "./Middleware/tuterUpload.js";
import studentOnly from "./Middleware/studentOnly.js";






const router = Router();

router.route("/register").post(rh.REGISTER);
router.route("/login_user").post(rh.LOGIN);

router.route("/user_forgoat_password_send_otp").post(rh.FORGOT_PASSWORD_SEND_OTP);
router.route("/user_forgoat_password_verify_otp").post(rh.FORGOT_PASSWORD_VERIFY_OTP);
router.route("/user_reset_password").post(rh.RESET_PASSWORD);

router.route("/upload_profile_photo").put(Auth, rh.UPLOAD_PROFILE_PHOTO);
router.route("/my_profile").get(Auth, rh.GET_MY_PROFILE);
router.route("/update_my_profile").put(Auth, rh.UPDATE_MY_PROFILE);

// ================= BANNER =================
router.route("/admin/banner/create").post(Auth,adminOnly,bannerUpload.single("image"),rh.CREATE_BANNER);
router.route("/admin/banner/all").get( Auth, adminOnly, rh.GET_ALL_BANNERS_ADMIN);
router.route("/banner/all").get(rh.GET_ACTIVE_BANNERS);
router.route("/admin/banner/update/:bannerId").put(Auth,adminOnly,bannerUpload.single("image"),rh.UPDATE_BANNER);
router.route("/admin/banner/delete/:bannerId").delete(Auth,adminOnly,rh.DELETE_BANNER);

// ================= CATEGORY =================
router.route("/admin/category/all").get(Auth,adminOnly,rh.GET_ALL_CATEGORIES_ADMIN);
router.route("/category/all").get(rh.GET_ACTIVE_CATEGORIES);//user 
router.route("/category/:categoryId").get(rh.GET_SINGLE_CATEGORY);
router.route("/admin/category/update/:categoryId").put(Auth,adminOnly,categoryUpload.single("image"), rh.UPDATE_CATEGORY);

// ================= COURSE =================
router.route("/admin/course/create").post(Auth,adminOnly,courseUpload.single("image"),rh.CREATE_COURSE);
router.route("/admin/course/all").get(Auth,adminOnly,rh.GET_ALL_COURSES_ADMIN);
router.route("/course/by-category/:categoryId").get(rh.GET_COURSES_BY_CATEGORY);
router.route("/course/:courseId").get(rh.GET_SINGLE_COURSE);
router.route("/admin/course/update/:courseId").put(Auth,adminOnly,courseUpload.single("image"),rh.UPDATE_COURSE);
router.route("/admin/course/delete/:courseId").delete(Auth,adminOnly,rh.DELETE_COURSE);



//tutermanagemant

// ================= TUTER MANAGEMENT =================
router.route("/admin/tuter/create").post(Auth, adminOnly, tuterUpload.single("photo"), rh.CREATE_TUTER);
router.route("/admin/tuter/all").get(Auth, adminOnly, rh.GET_ALL_TUTERS_ADMIN);
router.route("/admin/tuter/update/:tuterId").put(Auth, adminOnly, tuterUpload.single("photo"), rh.UPDATE_TUTER);
router.route("/admin/tuter/delete/:tuterId").delete(Auth, adminOnly, rh.DELETE_TUTER);
router.route("/admin/tuter/status/:tuterId").patch(Auth, adminOnly, rh.TOGGLE_TUTER_STATUS_ADMIN);

//tute rby students

router.route("/tuter/all").get(Auth, rh.GET_ALL_TUTERS_USER);
router.route("/tuter/by-category/:categoryId").get(Auth, rh.GET_TUTERS_BY_CATEGORY);
router.route("/tuter/by-course/:courseId").get(Auth, rh.GET_TUTERS_BY_COURSE);
router.route("/tuter/:tuterId").get(Auth, rh.GET_SINGLE_TUTER);
router.route("/tuter/:tuterId/review").post(Auth, studentOnly, rh.ADD_TUTER_REVIEW);




//student management


// ================= STUDENT INVITE =================
router.route("/admin/student/invite").post(Auth, adminOnly, rh.INVITE_STUDENT_ADMIN);
router.route("/student/invite/:inviteToken").get(rh.VERIFY_STUDENT_INVITE);



// ================= student MANAGEMENT (ADMIN) =================
router.route("/admin/student/all").get(Auth, adminOnly, rh.GET_ALL_STUDENTS_ADMIN);
router.route("/admin/student/:userId").get(Auth, adminOnly, rh.GET_SINGLE_STUDENT_ADMIN);
router.route("/admin/student/update/:userId").put(Auth, adminOnly, rh.UPDATE_STUDENT_ADMIN);
router.route("/admin/student/delete/:userId").delete(Auth, adminOnly, rh.DELETE_STUDENT_ADMIN);



export default router;