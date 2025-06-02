
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/donation');

const handleServerError = (res, err, location = '') => {
  console.error(`[CampaignController] ${location} error:`, err);
  res.status(500).json({ message: 'Server error', error: err.message });
};

// ✅ Create new campaign
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

    const image = req.file ? req.file.filename : null;

    const campaign = await Campaign.create({
      title,
      description,
      goalAmount: Number(goalAmount),
      owner: req.user.id,
      image,
      status: 'active',
      withdrawn: false,
      raisedAmount: 0,
    });

    res.status(201).json(campaign);
  } catch (err) {
    handleServerError(res, err, 'createCampaign');
  }
};

// ✅ Get all campaigns with status active, completed, or withdrawn
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: { $in: ['active', 'completed', 'withdrawn'] }
    })
      .populate('owner', 'name email')
      .populate({ path: 'donations', model: 'Donation' });

    res.json(campaigns);
  } catch (err) {
    handleServerError(res, err, 'getAllCampaigns');
  }
};

// ✅ Get campaigns by user
exports.getUserCampaigns = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    const campaigns = await Campaign.find({ owner: req.user.id })
      .populate('owner', 'name email')
      .populate({ path: 'donations', model: 'Donation' });

    res.json(campaigns);
  } catch (err) {
    handleServerError(res, err, 'getUserCampaigns');
  }
};

// ✅ Get campaign by ID (auto-update status if goal reached)
exports.getCampaignById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id)
      .populate('owner', 'name email')
      .populate({ path: 'donations', model: 'Donation' });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Auto-update status if goal reached
    if (
      campaign.raisedAmount >= campaign.goalAmount &&
      campaign.status === 'active'
    ) {
      campaign.status = 'completed';
      await campaign.save();
    }

    res.json(campaign);
  } catch (err) {
    handleServerError(res, err, 'getCampaignById');
  }
};

// ✅ Update campaign
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
    if (req.file) campaign.image = req.file.filename;

    // Auto-update status if raisedAmount >= new goalAmount
    if (
      campaign.raisedAmount >= campaign.goalAmount &&
      campaign.status === 'active'
    ) {
      campaign.status = 'completed';
    }

    const updatedCampaign = await campaign.save();
    res.json(updatedCampaign);
  } catch (err) {
    handleServerError(res, err, 'updateCampaign');
  }
};

// ✅ Delete campaign with safeguards (allow deletion if withdrawn, block if completed)
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

    if (
      !req.user ||
      (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this campaign' });
    }

    // Prevent deleting completed campaigns only
    if (campaign.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete a completed campaign' });
    }

    console.log(`[Delete Request] User ${req.user.id} requested delete on campaign ${id}`);

    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    handleServerError(res, err, 'deleteCampaign');
  }
};

// ✅ Withdraw funds (with safe checks)
exports.withdrawCampaignFunds = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (
      !req.user ||
      (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Not authorized to withdraw funds' });
    }

    // Check if goal reached
    if (campaign.raisedAmount < campaign.goalAmount) {
      return res.status(400).json({ message: 'Cannot withdraw: goal not yet reached' });
    }

    // Check if already withdrawn
    if (campaign.withdrawn === true) {
      return res.status(400).json({ message: 'Funds already withdrawn' });
    }

    // Mark withdrawn + reset raisedAmount + update status
    campaign.withdrawn = true;
    campaign.raisedAmount = 0;
    campaign.status = 'withdrawn';

    const updatedCampaign = await campaign.save();

    res.json({
      message: `Funds withdrawn successfully from campaign "${campaign.title}"`,
      campaign: updatedCampaign,
    });
  } catch (err) {
    handleServerError(res, err, 'withdrawCampaignFunds');
  }
};
