

const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/donation');

// ====== Campaign functions ======

const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate('owner', 'name email');
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.status = 'active';
    await campaign.save();

    res.json({ message: 'Campaign approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.status = 'rejected';
    await campaign.save();

    res.json({ message: 'Campaign rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    await campaign.deleteOne();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingCampaignsDetailed = async (req, res) => {
  try {
    const pendingCampaigns = await Campaign.find({ status: 'pending' })
      .populate('owner', 'name email role createdAt updatedAt')
      .populate('donations')
      .select('title description goalAmount raisedAmount image categories deadline createdAt updatedAt owner status');

    res.json(pendingCampaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ NEW: Get campaigns by status (e.g., approved, rejected, active, etc.)
const getCampaignsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['approved', 'rejected', 'deleted', 'completed', 'withdrawn', 'active'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid campaign status' });
    }

    const campaigns = await Campaign.find({ status })
      .populate('owner', 'name email role createdAt updatedAt')
      .populate('donations')
      .select('title description goalAmount raisedAmount image categories deadline createdAt updatedAt owner status');

    res.json(campaigns);
  } catch (err) {
    console.error('Error in getCampaignsByStatus:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const editCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const updates = {
      title: req.body.title,
      description: req.body.description,
      goalAmount: req.body.goalAmount ? parseFloat(req.body.goalAmount) : undefined,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      categories: req.body.categories
        ? Array.isArray(req.body.categories)
          ? req.body.categories
          : req.body.categories.split(',').map((c) => c.trim())
        : undefined,
    };

    if (req.file) {
      updates.image = req.file.filename;
    }

    const allowedFields = ['title', 'description', 'goalAmount', 'image', 'categories', 'deadline'];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        campaign[field] = updates[field];
      }
    });

    await campaign.save();
    res.json({ message: 'Campaign updated successfully', campaign });
  } catch (err) {
    console.error('Error in editCampaign:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ====== User Management ======

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ====== System Stats ======

const getSystemStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const campaignCount = await Campaign.countDocuments();
    const donationCount = await Donation.countDocuments();

    const campaignStatusCounts = await Campaign.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const campaignStatusOverview = {};
    campaignStatusCounts.forEach(({ _id, count }) => {
      campaignStatusOverview[_id || 'unknown'] = count;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });

    const totalRaised = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalDonationAmount = totalRaised[0]?.total || 0;

    const todayRaised = await Donation.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todaysDonationAmount = todayRaised[0]?.total || 0;

    res.json({
      totalUsers: userCount,
      totalCampaigns: campaignCount,
      totalDonations: donationCount,
      newUsersToday,
      pendingCampaigns,
      totalDonationAmount,
      todaysDonationAmount,
      campaignStatusOverview,

      // Flattened status counts for frontend compatibility:
      activeCampaigns: campaignStatusOverview.active || 0,
      rejectedCampaigns: campaignStatusOverview.rejected || 0,
      completedCampaigns: campaignStatusOverview.completed || 0,
      withdrawnCampaigns: campaignStatusOverview.withdrawn || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCampaigns,
  approveCampaign,
  rejectCampaign,
  deleteCampaign,
  getPendingCampaignsDetailed,
  getCampaignsByStatus,
  editCampaign,
  getAllUsers,
  updateUser,
  deleteUser,
  getSystemStats,
};
