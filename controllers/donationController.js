
const Donation = require('../models/donation');
const Campaign = require('../models/Campaign');

// POST /api/donations
const createDonation = async (req, res) => {
  const { amount, message, campaignId } = req.body;

  if (amount < 1) {
    return res.status(400).json({ message: 'Minimum donation is $1' });
  }

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const donation = await Donation.create({
      amount,
      message,
      user: req.user._id,
      campaign: campaignId,
    });

    campaign.raisedAmount += amount;
    await campaign.save();

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/donations/campaign/:campaignId
const getDonationsByCampaign = async (req, res) => {
  try {
    const donations = await Donation.find({ campaign: req.params.campaignId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/donations/user/:userId
const getDonationsByUser = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.params.userId })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/donations (admin only)
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('user', 'name email')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getAllDonations,
};
