

// import { Router } from "express";
// import * as rh from "./Requesthandeler.js";
// import Auth from "./Middleware/Auth.js";
// import adminOnly from "./Middleware/adminOnly.js";
// import bannerUpload from "./Middleware/bannerUpload.js";
// import categoryUpload from "./Middleware/categoryUpload.js";
// import courseUpload from "./Middleware/courseUpload.js";
// import tuterUpload from "./Middleware/tuterUpload.js";
// import studentOnly from "./Middleware/studentOnly.js";
// import chatUpload from "./Middleware/chatUpload.js";





// const router = Router();


// router.post(
//   "/chat/student-admin-room",
//   Auth,
//   studentOnly,
//   rh.CREATE_OR_GET_STUDENT_ADMIN_CHAT
// );





// router.route("/register").post(rh.REGISTER);
// router.route("/login_user").post(rh.LOGIN);
// router.route("/change_password").put(Auth, rh.CHANGE_PASSWORD);
// router.route("/user_forgoat_password_send_otp").post(rh.FORGOT_PASSWORD_SEND_OTP);
// router.route("/user_forgoat_password_verify_otp").post(rh.FORGOT_PASSWORD_VERIFY_OTP);
// router.route("/user_reset_password").post(rh.RESET_PASSWORD);

// router.route("/upload_profile_photo").put(Auth, rh.UPLOAD_PROFILE_PHOTO);
// router.route("/my_profile").get(Auth, rh.GET_MY_PROFILE);
// router.route("/update_my_profile").put(Auth, rh.UPDATE_MY_PROFILE);
// router.route("/delete_my_account").delete(Auth,studentOnly, rh.DELETE_MY_ACCOUNT);

// // ================= BANNER =================
// router.route("/admin/banner/create").post(Auth,adminOnly,bannerUpload.single("image"),rh.CREATE_BANNER);
// router.route("/admin/banner/all").get( Auth, adminOnly, rh.GET_ALL_BANNERS_ADMIN);
// router.route("/banner/all").get(rh.GET_ACTIVE_BANNERS);
// router.route("/admin/banner/update/:bannerId").put(Auth,adminOnly,bannerUpload.single("image"),rh.UPDATE_BANNER);
// router.route("/admin/banner/delete/:bannerId").delete(Auth,adminOnly,rh.DELETE_BANNER);

// // ================= CATEGORY =================
// router.route("/admin/category/all").get(Auth,adminOnly,rh.GET_ALL_CATEGORIES_ADMIN);
// router.route("/category/all").get(rh.GET_ACTIVE_CATEGORIES);//user 
// router.route("/category/:categoryId").get(rh.GET_SINGLE_CATEGORY);
// router.route("/admin/category/update/:categoryId").put(Auth,adminOnly,categoryUpload.single("image"), rh.UPDATE_CATEGORY);

// // ================= COURSE =================
// router.route("/admin/course/create").post(Auth,adminOnly,courseUpload.single("image"),rh.CREATE_COURSE);
// router.route("/admin/course/all").get(Auth,adminOnly,rh.GET_ALL_COURSES_ADMIN);
// router.route("/course/by-category/:categoryId").get(rh.GET_COURSES_BY_CATEGORY);
// router.route("/course/:courseId").get(rh.GET_SINGLE_COURSE);
// router.route("/admin/course/update/:courseId").put(Auth,adminOnly,courseUpload.single("image"),rh.UPDATE_COURSE);
// router.route("/admin/course/delete/:courseId").delete(Auth,adminOnly,rh.DELETE_COURSE);



// //tutermanagemant

// // ================= TUTER MANAGEMENT =================
// router.route("/admin/tuter/create").post(Auth, adminOnly, tuterUpload.single("photo"), rh.CREATE_TUTER);
// router.route("/admin/tuter/all").get(Auth, adminOnly, rh.GET_ALL_TUTERS_ADMIN);
// router.route("/admin/tuter/update/:tuterId").put(Auth, adminOnly, tuterUpload.single("photo"), rh.UPDATE_TUTER);
// router.route("/admin/tuter/delete/:tuterId").delete(Auth, adminOnly, rh.DELETE_TUTER);
// router.route("/admin/tuter/status/:tuterId").patch(Auth, adminOnly, rh.TOGGLE_TUTER_STATUS_ADMIN);

// //tute rby students

// router.route("/tuter/all").get(Auth, rh.GET_ALL_TUTERS_USER);
// router.route("/tuter/by-category/:categoryId").get(Auth, rh.GET_TUTERS_BY_CATEGORY);
// router.route("/tuter/by-course/:courseId").get(Auth, rh.GET_TUTERS_BY_COURSE);
// router.route("/tuter/:tuterId").get(Auth, rh.GET_SINGLE_TUTER);
// router.route("/tuter/:tuterId/review").post(Auth, studentOnly, rh.ADD_TUTER_REVIEW);
// router.route("/tuter/:tuterId/review").delete(Auth, studentOnly, rh.DELETE_TUTER_REVIEW);



// //student management


// // ================= STUDENT INVITE =================
// router.route("/admin/student/invite").post(Auth, adminOnly, rh.INVITE_STUDENT_ADMIN);
// router.route("/student/invite/:inviteToken").get(rh.VERIFY_STUDENT_INVITE);



// // ================= student MANAGEMENT (ADMIN) =================
// router.route("/admin/student/all").get(Auth, adminOnly, rh.GET_ALL_STUDENTS_ADMIN);
// router.route("/admin/student/:userId").get(Auth, adminOnly, rh.GET_SINGLE_STUDENT_ADMIN);
// router.route("/admin/student/update/:userId").put(Auth, adminOnly, rh.UPDATE_STUDENT_ADMIN);
// router.route("/admin/student/delete/:userId").delete(Auth, adminOnly, rh.DELETE_STUDENT_ADMIN);












// // ================= CHAT =================

// router.route("/chat/connect-request/:tuterId").post(Auth, studentOnly, rh.CREATE_CONNECT_REQUEST_CHAT);

// router.route("/chat/rooms").get(Auth, rh.GET_MY_CHAT_ROOMS);

// router.route("/chat/messages/:roomId").get(Auth, rh.GET_CHAT_MESSAGES);

// router.route("/chat/message/:roomId").post(Auth, rh.SEND_CHAT_MESSAGE);

// router.route("/chat/file-message/:roomId").post(
//   Auth,
//   chatUpload.array("files", 10),
//   rh.SEND_CHAT_FILE_MESSAGE
// );

// router.route("/chat/read/:roomId").patch(Auth, rh.MARK_CHAT_MESSAGES_READ);

// router.route("/chat/message/:messageId").patch(Auth, rh.UPDATE_CHAT_MESSAGE);
// router.route("/chat/message/:messageId").delete(Auth, rh.DELETE_CHAT_MESSAGE);



// router.route("/chat/admin-student-room/:studentId").post(Auth, adminOnly, rh.CREATE_OR_GET_ADMIN_STUDENT_CHAT);
// // ================= ADMIN DASHBOARD =================
// router.route("/admin/dashboard").get(Auth, adminOnly, rh.ADMIN_DASHBOARD);




// // ================= FEEDBACK =================

// // student add/update feedback
// router.route("/feedback").post(Auth, studentOnly, rh.ADD_FEEDBACK);

// // student get own feedback
// router.route("/feedback/my").get(Auth, studentOnly, rh.GET_MY_FEEDBACK);

// // user get all feedback
// router.route("/get/feedback/all").get(Auth, rh.GET_ALL_FEEDBACK);








// export default router;













































































import { Router } from "express";
import * as rh from "./Requesthandeler.js";
import Auth from "./Middleware/Auth.js";
import adminOnly from "./Middleware/adminOnly.js";
import studentOnly from "./Middleware/studentOnly.js";
import cloudinaryUpload from "./Middleware/cloudinaryUpload.js";

const router = Router();

// ================= CHAT: STUDENT ADMIN ROOM =================
router.post(
  "/chat/student-admin-room",
  Auth,
  studentOnly,
  rh.CREATE_OR_GET_STUDENT_ADMIN_CHAT
);

// ================= AUTH =================
router.route("/register").post(rh.REGISTER);
router.route("/login_user").post(rh.LOGIN);
router.route("/change_password").put(Auth, rh.CHANGE_PASSWORD);
router.route("/user_forgoat_password_send_otp").post(rh.FORGOT_PASSWORD_SEND_OTP);
router.route("/user_forgoat_password_verify_otp").post(rh.FORGOT_PASSWORD_VERIFY_OTP);
router.route("/user_reset_password").post(rh.RESET_PASSWORD);

// ================= PROFILE =================
router.route("/upload_profile_photo").put(Auth, rh.UPLOAD_PROFILE_PHOTO);
router.route("/my_profile").get(Auth, rh.GET_MY_PROFILE);
router.route("/update_my_profile").put(Auth, rh.UPDATE_MY_PROFILE);
router.route("/delete_my_account").delete(Auth, studentOnly, rh.DELETE_MY_ACCOUNT);

// ================= BANNER =================
router
  .route("/admin/banner/create")
  .post(Auth, adminOnly, cloudinaryUpload.single("image"), rh.CREATE_BANNER);

router.route("/admin/banner/all").get(Auth, adminOnly, rh.GET_ALL_BANNERS_ADMIN);
router.route("/banner/all").get(rh.GET_ACTIVE_BANNERS);

router
  .route("/admin/banner/update/:bannerId")
  .put(Auth, adminOnly, cloudinaryUpload.single("image"), rh.UPDATE_BANNER);

router.route("/admin/banner/delete/:bannerId").delete(Auth, adminOnly, rh.DELETE_BANNER);

// ================= CATEGORY =================
router.route("/admin/category/all").get(Auth, adminOnly, rh.GET_ALL_CATEGORIES_ADMIN);
router.route("/category/all").get(rh.GET_ACTIVE_CATEGORIES);
router.route("/category/:categoryId").get(rh.GET_SINGLE_CATEGORY);

router
  .route("/admin/category/update/:categoryId")
  .put(Auth, adminOnly, cloudinaryUpload.single("image"), rh.UPDATE_CATEGORY);

// ================= COURSE =================
router
  .route("/admin/course/create")
  .post(Auth, adminOnly, cloudinaryUpload.single("image"), rh.CREATE_COURSE);

router.route("/admin/course/all").get(Auth, adminOnly, rh.GET_ALL_COURSES_ADMIN);
router.route("/course/by-category/:categoryId").get(rh.GET_COURSES_BY_CATEGORY);
router.route("/course/:courseId").get(rh.GET_SINGLE_COURSE);

router
  .route("/admin/course/update/:courseId")
  .put(Auth, adminOnly, cloudinaryUpload.single("image"), rh.UPDATE_COURSE);

router.route("/admin/course/delete/:courseId").delete(Auth, adminOnly, rh.DELETE_COURSE);

// ================= TUTER MANAGEMENT =================
router
  .route("/admin/tuter/create")
  .post(Auth, adminOnly, cloudinaryUpload.single("photo"), rh.CREATE_TUTER);

router.route("/admin/tuter/all").get(Auth, adminOnly, rh.GET_ALL_TUTERS_ADMIN);

router
  .route("/admin/tuter/update/:tuterId")
  .put(Auth, adminOnly, cloudinaryUpload.single("photo"), rh.UPDATE_TUTER);

router.route("/admin/tuter/delete/:tuterId").delete(Auth, adminOnly, rh.DELETE_TUTER);
router.route("/admin/tuter/status/:tuterId").patch(Auth, adminOnly, rh.TOGGLE_TUTER_STATUS_ADMIN);

// ================= TUTER BY STUDENTS =================
router.route("/tuter/all").get(Auth, rh.GET_ALL_TUTERS_USER);
router.route("/tuter/by-category/:categoryId").get(Auth, rh.GET_TUTERS_BY_CATEGORY);
router.route("/tuter/by-course/:courseId").get(Auth, rh.GET_TUTERS_BY_COURSE);
router.route("/tuter/:tuterId").get(Auth, rh.GET_SINGLE_TUTER);
router.route("/tuter/:tuterId/review").post(Auth, studentOnly, rh.ADD_TUTER_REVIEW);
router.route("/tuter/:tuterId/review").delete(Auth, studentOnly, rh.DELETE_TUTER_REVIEW);

// ================= STUDENT INVITE =================
router.route("/admin/student/invite").post(Auth, adminOnly, rh.INVITE_STUDENT_ADMIN);
router.route("/student/invite/:inviteToken").get(rh.VERIFY_STUDENT_INVITE);

// ================= STUDENT MANAGEMENT ADMIN =================
router.route("/admin/student/all").get(Auth, adminOnly, rh.GET_ALL_STUDENTS_ADMIN);
router.route("/admin/student/:userId").get(Auth, adminOnly, rh.GET_SINGLE_STUDENT_ADMIN);
router.route("/admin/student/update/:userId").put(Auth, adminOnly, rh.UPDATE_STUDENT_ADMIN);
router.route("/admin/student/delete/:userId").delete(Auth, adminOnly, rh.DELETE_STUDENT_ADMIN);

// ================= CHAT =================
router.route("/chat/connect-request/:tuterId").post(Auth, studentOnly, rh.CREATE_CONNECT_REQUEST_CHAT);
router.route("/chat/rooms").get(Auth, rh.GET_MY_CHAT_ROOMS);
router.route("/chat/messages/:roomId").get(Auth, rh.GET_CHAT_MESSAGES);
router.route("/chat/message/:roomId").post(Auth, rh.SEND_CHAT_MESSAGE);

router
  .route("/chat/file-message/:roomId")
  .post(Auth, cloudinaryUpload.array("files", 10), rh.SEND_CHAT_FILE_MESSAGE);

router.route("/chat/read/:roomId").patch(Auth, rh.MARK_CHAT_MESSAGES_READ);
router.route("/chat/message/:messageId").patch(Auth, rh.UPDATE_CHAT_MESSAGE);
router.route("/chat/message/:messageId").delete(Auth, rh.DELETE_CHAT_MESSAGE);

router
  .route("/chat/admin-student-room/:studentId")
  .post(Auth, adminOnly, rh.CREATE_OR_GET_ADMIN_STUDENT_CHAT);

// ================= ADMIN DASHBOARD =================
router.route("/admin/dashboard").get(Auth, adminOnly, rh.ADMIN_DASHBOARD);

// ================= FEEDBACK =================
router.route("/feedback").post(Auth, studentOnly, rh.ADD_FEEDBACK);
router.route("/feedback/my").get(Auth, studentOnly, rh.GET_MY_FEEDBACK);
router.route("/get/feedback/all").get(Auth, rh.GET_ALL_FEEDBACK);

export default router;