


const Donation = require('../models/donation');
const Campaign = require('../models/Campaign');

// POST /api/donations - create donation, user optional
const createDonation = async (req, res) => {
  const { amount, message = '', campaignId } = req.body;

  if (!campaignId) {
    return res.status(400).json({ message: 'Campaign ID is required' });
  }

  if (!amount || amount < 1) {
    return res.status(400).json({ message: 'Minimum donation is $1' });
  }

  if (message.length > 200) {
    return res.status(400).json({ message: 'Message cannot exceed 200 characters' });
  }

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const donationData = {
      amount,
      message,
      campaign: campaignId,
    };

    if (req.user && req.user._id) {
      donationData.user = req.user._id;
    }

    // Create the donation
    const donation = await Donation.create(donationData);

    // Update campaign raisedAmount and status if goal reached
    campaign.raisedAmount += amount;

    if (campaign.raisedAmount >= campaign.goalAmount && campaign.status === 'active') {
      campaign.status = 'completed';
    }

    await campaign.save();

    // Return both donation and updated campaign
    res.status(201).json({ donation, campaign });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ message: 'Server error while processing donation' });
  }
};

// GET donations by campaign
const getDonationsByCampaign = async (req, res) => {
  try {
    const donations = await Donation.find({ campaign: req.params.campaignId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations by campaign:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

// GET donations by user
const getDonationsByUser = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.params.userId })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations by user:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

// GET all donations (admin only)
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('user', 'name email')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
};

module.exports = {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getAllDonations,
};
