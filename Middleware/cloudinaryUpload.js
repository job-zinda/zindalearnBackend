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
  params: async () => ({
    folder: "zindalearn",
    resource_type: "auto",
  }),
});

const cloudinaryUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export default cloudinaryUpload;