
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/donation');

const handleServerError = (res, err, location = '') => {
  console.error(`[CampaignController] ${location} error:`, err);
  res.status(500).json({ message: 'Server error', error: err.message });
};

// ✅ Create new campaign (defaults to pending)
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
      withdrawn: false,
      raisedAmount: 0,
      status: 'pending',
    });

    res.status(201).json({ message: 'Campaign submitted for review', campaign });
  } catch (err) {
    handleServerError(res, err, 'createCampaign');
  }
};

// ✅ Public: Get all campaigns (active, completed, withdrawn)
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: { $in: ['active', 'completed', 'withdrawn'] },
    })
      .populate('owner', 'name email')
      .populate({ path: 'donations', model: 'Donation' });

    res.json(campaigns);
  } catch (err) {
    handleServerError(res, err, 'getAllCampaigns');
  }
};

// ✅ Get campaigns by logged-in user
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

// ✅ Get campaign by ID
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

// ✅ Update campaign (owner or admin)
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

    if (
      !req.user ||
      (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this campaign' });
    }

    if (campaign.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete a completed campaign' });
    }

    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    handleServerError(res, err, 'deleteCampaign');
  }
};

// ✅ Withdraw funds
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

    if (campaign.raisedAmount < campaign.goalAmount) {
      return res.status(400).json({ message: 'Cannot withdraw: goal not yet reached' });
    }

    if (campaign.withdrawn === true) {
      return res.status(400).json({ message: 'Funds already withdrawn' });
    }

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

// ✅ Admin: Get all pending campaigns
exports.getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending' })
      .populate('owner', 'name email');

    const detailed = await Promise.all(
      campaigns.map(async (campaign) => {
        const donationCount = await Donation.countDocuments({ campaign: campaign._id });
        const donations = await Donation.aggregate([
          { $match: { campaign: campaign._id } },
          { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
        ]);
        const totalDonated = donations.length ? donations[0].totalAmount : 0;

        const progressPercent = campaign.goalAmount > 0
          ? Math.min((totalDonated / campaign.goalAmount) * 100, 100)
          : 0;

        return {
          ...campaign.toObject(),
          donationCount,
          totalDonated,
          progressPercent: Number(progressPercent.toFixed(2)),
        };
      })
    );

    res.json(detailed);
  } catch (err) {
    handleServerError(res, err, 'getPendingCampaigns');
  }
};

// ✅ Admin: Approve campaign
exports.approveCampaign = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending campaigns can be approved' });
    }

    campaign.status = 'active';
    await campaign.save();

    res.json({ message: 'Campaign approved successfully', campaign });
  } catch (err) {
    handleServerError(res, err, 'approveCampaign');
  }
};

// ✅ Admin: Reject campaign with reason
exports.rejectCampaign = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending campaigns can be rejected' });
    }

    campaign.status = 'rejected';
    campaign.rejectionReason = reason || 'No reason provided';
    await campaign.save();

    res.json({ message: 'Campaign rejected', reason: campaign.rejectionReason });
  } catch (err) {
    handleServerError(res, err, 'rejectCampaign');
  }
};

// ✅ Admin: Edit any campaign
exports.editCampaign = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid campaign ID format' });
  }

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const { title, description, goalAmount, status } = req.body;

    if (title !== undefined) campaign.title = title;
    if (description !== undefined) campaign.description = description;
    if (goalAmount !== undefined) campaign.goalAmount = Number(goalAmount);
    if (status !== undefined) campaign.status = status;
    if (req.file) campaign.image = req.file.filename;

    const updated = await campaign.save();

    res.json({
      message: 'Campaign updated by admin',
      campaign: updated,
    });
  } catch (err) {
    handleServerError(res, err, 'editCampaign');
  }
};
