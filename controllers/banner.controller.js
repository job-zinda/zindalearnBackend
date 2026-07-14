import mongoose from 'mongoose';
import Banner from '../models/Banner.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, total: banners.length, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, isActive } = req.body;
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Title, description and image are required' });
    }

    const lastBanner = await Banner.findOne().sort({ order: -1 });
    const order = lastBanner ? lastBanner.order + 1 : 0;

    const banner = await Banner.create({ title, description, imageUrl, linkUrl, isActive, order });
    res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const { title, description, imageUrl, linkUrl, isActive } = req.body;
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { title, description, imageUrl, linkUrl, isActive },
      { new: true, runValidators: true }
    );

    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.status(200).json({ success: true, message: 'Banner updated successfully', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({ success: true, message: `Banner ${banner.isActive ? 'activated' : 'hidden'}`, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reorderBanners = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderedIds must be a non-empty array' });
    }

    await Promise.all(
      orderedIds.map((id, index) => Banner.findByIdAndUpdate(id, { order: index }))
    );

    res.status(200).json({ success: true, message: 'Banners reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
