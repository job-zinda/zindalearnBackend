// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async () => ({
//     folder: "zindalearn",
//     resource_type: "auto",
//   }),
// });

// const cloudinaryUpload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
// });

// export default cloudinaryUpload;



















































// import "dotenv/config";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async () => ({
//     folder: "zindalearn",
//     resource_type: "auto",
//   }),
// });

// const cloudinaryUpload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
// });

// export default cloudinaryUpload;



















// import "dotenv/config";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => ({
//     folder: "zindalearn/uploads",
//     resource_type: "image",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [
//       { width: 500, height: 500, crop: "limit", quality: "auto", fetch_format: "auto" },
//     ],
//   }),
// });

// const cloudinaryUpload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// export default cloudinaryUpload;






























// import "dotenv/config";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async () => ({
//     folder: "zindalearn/photos",
//     resource_type: "image",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [
//       {
//         width: 500,
//         height: 500,
//         crop: "limit",
//         quality: "auto",
//         fetch_format: "auto",
//       },
//     ],
//   }),
// });

// const cloudinaryUpload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter(req, file, cb) {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed"), false);
//     }
//   },
// });

// export default cloudinaryUpload;
































// import "dotenv/config";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const isImage = file.mimetype.startsWith("image/");

//     return {
//       folder: "zindalearn/uploads",
//       resource_type: "auto",
//       allowed_formats: [
//         "jpg",
//         "jpeg",
//         "png",
//         "webp",
//         "pdf",
//         "doc",
//         "docx",
//         "xls",
//         "xlsx",
//         "mp4",
//         "mp3",
//         "wav",
//       ],
//       transformation: isImage
//         ? [
//             {
//               width: 800,
//               height: 800,
//               crop: "limit",
//               quality: "auto",
//               fetch_format: "auto",
//             },
//           ]
//         : undefined,
//     };
//   },
// });

// const cloudinaryUpload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
// });

// export default cloudinaryUpload;




















import "dotenv/config";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const mime = file.mimetype || "";
    const isImage = mime.startsWith("image/");

    return {
      folder: "zindalearn/uploads",
      resource_type: "auto",

      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",

        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",

        "mp4",
        "mov",
        "webm",

        "mp3",
        "wav",
        "ogg",
        "m4a",
        "aac",
      ],

      transformation: isImage
        ? [
            {
              width: 800,
              height: 800,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ]
        : undefined,
    };
  },
});

function fileFilter(req, file, cb) {
  const mime = file.mimetype || "";

  const allowed =
    mime.startsWith("image/") ||
    mime.startsWith("audio/") ||
    mime.startsWith("video/") ||
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.ms-excel" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (!allowed) {
    return cb(new Error(`Unsupported file type: ${mime}`), false);
  }

  cb(null, true);
}

const cloudinaryUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export default cloudinaryUpload;