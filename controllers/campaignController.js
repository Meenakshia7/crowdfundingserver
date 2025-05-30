
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/donation');

const handleServerError = (res, err, location = '') => {
  console.error(`[CampaignController] ${location} error:`, err);
  res.status(500).json({ message: 'Server error', error: err.message });
};

// ✅ Create new campaign with image upload
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount } = req.body;

    if (!title || !description || isNaN(goalAmount) || Number(goalAmount) <= 0) {
      return res.status(400).json({
        message: 'Please provide a valid title, description, and positive goal amount',
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    const image = req.file ? req.file.filename : null; // ✅ get filename from multer

    const campaign = await Campaign.create({
      title,
      description,
      goalAmount: Number(goalAmount),
      owner: req.user.id,
      image, // ✅ store filename
    });

    res.status(201).json(campaign);
  } catch (err) {
    handleServerError(res, err, 'createCampaign');
  }
};

// ✅ Get all active campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' })
      .populate('owner', 'name email')
      .populate({
        path: 'donations',
        model: 'Donation',
      });

    res.json(campaigns);
  } catch (err) {
    handleServerError(res, err, 'getAllCampaigns');
  }
};

// ✅ Get campaigns owned by logged-in user
exports.getUserCampaigns = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    const campaigns = await Campaign.find({ owner: req.user.id })
      .populate('owner', 'name email')
      .populate({
        path: 'donations',
        model: 'Donation',
      });

    res.json(campaigns);
  } catch (err) {
    handleServerError(res, err, 'getUserCampaigns');
  }
};

// ✅ Get campaign by ID
exports.getCampaignById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id)
      .populate('owner', 'name email')
      .populate({
        path: 'donations',
        model: 'Donation',
      });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (err) {
    handleServerError(res, err, 'getCampaignById');
  }
};

// ✅ Update campaign with optional image upload
exports.updateCampaign = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Ownership or admin check
    if (
      !req.user ||
      (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Not authorized to update this campaign' });
    }

    const { title, description, goalAmount, status } = req.body;

    if (title !== undefined) campaign.title = title;
    if (description !== undefined) campaign.description = description;
    if (goalAmount !== undefined) campaign.goalAmount = Number(goalAmount);
    if (status !== undefined) campaign.status = status;

    if (req.file) {
      campaign.image = req.file.filename; // ✅ update image if a new file is uploaded
    }

    const updatedCampaign = await campaign.save();
    res.json(updatedCampaign);
  } catch (err) {
    handleServerError(res, err, 'updateCampaign');
  }
};

// ✅ Delete campaign
exports.deleteCampaign = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Ownership or admin check
    if (
      !req.user ||
      (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this campaign' });
    }

    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    handleServerError(res, err, 'deleteCampaign');
  }
};
