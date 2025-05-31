

const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/authMiddleware');
const {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getAllDonations,
} = require('../controllers/donationController');

// Anyone (authenticated or not) can create a donation
router.post('/', createDonation);

// Protect these routes if you want only authenticated users to access
router.get('/campaign/:campaignId', protect, getDonationsByCampaign);
router.get('/user/:userId', protect, getDonationsByUser);

// Admin-only
router.get('/', protect, admin, getAllDonations);

module.exports = router;
