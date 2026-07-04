import { cloudinaryService } from "../services/cloudinary.service.js";
import fs from 'fs';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { folder = 'zinda-learn/courses/thumbnails' } = req.body;
    
    const result = await cloudinaryService.uploadFile(req.file.path, folder);
    
    // Clean up local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || "File upload failed"
    });
  }
};
