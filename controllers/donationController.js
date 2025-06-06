

const Donation = require('../models/donation');
const Campaign = require('../models/Campaign');

// ─────────────────────────────────────────────
// POST /api/donations - Create donation
// ─────────────────────────────────────────────
const createDonation = async (req, res) => {
  const { amount, message = '', campaignId, donorName, donorEmail } = req.body;

  if (!campaignId) {
    return res.status(400).json({ message: 'Campaign ID is required' });
  }

  if (!amount || amount < 1) {
    return res.status(400).json({ message: 'Minimum donation is ₹1' });
  }

  if (message.length > 200) {
    return res.status(400).json({ message: 'Message cannot exceed 200 characters' });
  }

  if (!donorName || !donorEmail) {
    return res.status(400).json({ message: 'Donor name and email are required' });
  }

  try {
    // console.log('User from protect middleware:', req.user);  // DEBUG

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const donationData = {
      amount,
      message,
      campaign: campaignId,
      donorName,
      donorEmail,
      user: req.user?._id || null, // ✅ Anonymous if not logged in
    };

    const donation = await Donation.create(donationData);

    // Update campaign raised amount
    campaign.raisedAmount += amount;

    // Optionally mark campaign as completed if goal is met
    if (campaign.raisedAmount >= campaign.goalAmount && campaign.status === 'active') {
      campaign.status = 'completed';
    }

    await campaign.save();

    res.status(201).json({ donation, campaign });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ message: 'Server error while processing donation' });
  }
};

// ─────────────────────────────────────────────
// GET /api/donations/campaign/:campaignId
// ─────────────────────────────────────────────
const getDonationsByCampaign = async (req, res) => {
  try {
    const donations = await Donation.find({ campaign: req.params.campaignId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by campaign:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

// ─────────────────────────────────────────────
// GET /api/donations/user/:userId (Admin only)
// ─────────────────────────────────────────────
const getDonationsByUser = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.params.userId })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by user:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

// ─────────────────────────────────────────────
// GET /api/donations/my-donations (User only)
// ─────────────────────────────────────────────
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user._id })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching my donations:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

// ─────────────────────────────────────────────
// GET /api/donations (Admin only)
// ─────────────────────────────────────────────
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('user', 'name email')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

module.exports = {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getMyDonations,
  getAllDonations,
};
