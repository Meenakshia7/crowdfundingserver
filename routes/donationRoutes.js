

const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/authMiddleware');
const {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getAllDonations,
} = require('../controllers/donationController');

router.post('/', protect, createDonation);
router.get('/campaign/:campaignId', protect, getDonationsByCampaign);
router.get('/user/:userId', protect, getDonationsByUser);
router.get('/', protect, admin, getAllDonations); // admin-only

module.exports = router;

