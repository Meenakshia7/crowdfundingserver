

const express = require('express');
const router = express.Router();

const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const {
  createDonation,
  getDonationsByCampaign,
  getDonationsByUser,
  getAllDonations,
  getMyDonations, // ✅ NEW
} = require('../controllers/donationController');

// ✅ 1. Anyone (authenticated or not) can donate
router.post('/', optionalAuth, createDonation);

// ✅ 2. Authenticated users can view donations of a specific campaign
router.get('/campaign/:campaignId', protect, getDonationsByCampaign);

// ✅ 3. 🔒 Admin can view donations by any user (you may remove if unnecessary)
router.get('/user/:userId', protect, admin, getDonationsByUser);

// ✅ 4. 🚫 Admin-only: Get all donations (keep or remove depending on policy)
router.get('/', protect, admin, getAllDonations);

// ✅ 5. 👤 Authenticated user gets *their* own donation history
router.get('/my-donations', protect, getMyDonations); // ✅ NEW

module.exports = router;



