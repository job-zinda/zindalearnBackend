import { v2 as cloudinary } from 'cloudinary';

// dotenv already loaded by server.js — no need to call dotenv.config() here

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryService = {
  /**
   * Generate a signed upload signature for direct browser upload
   * @param {string} courseId - Associated course ID for folder structure
   * @returns {Object} Signature data
   */
  generateUploadSignature: (courseId) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `zinda-learn/courses/${courseId}/videos`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        resource_type: 'video'
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    };
  },

  /**
   * Upload a video to Cloudinary from the backend
   * @param {string} filePath - Path to the local file
   * @param {string} courseId - Course ID for folder structure
   * @returns {Promise<Object>} Cloudinary upload result
   */
  uploadVideo: async (filePath, courseId) => {
    try {
      const folder = courseId 
        ? `zinda-learn/courses/${courseId}/videos`
        : `zinda-learn/courses/temp/videos`;
        
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: folder,
        chunk_size: 6000000, // 6MB chunks
      });
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },
  
  /**
   * Upload a file to Cloudinary (image or document)
   * @param {string} filePath - Path to local file
   * @param {string} folder - Folder name
   * @returns {Promise<Object>}
   */
  uploadFile: async (filePath, folder = 'zinda-learn/others') => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        folder: folder
      });
      return result;
    } catch (error) {
      console.error('Cloudinary file upload error:', error);
      throw error;
    }
  },

  /**
   * Delete a video from Cloudinary
   * @param {string} publicId - Cloudinary public_id
   */
  deleteVideo: async (publicId) => {
    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }
};
