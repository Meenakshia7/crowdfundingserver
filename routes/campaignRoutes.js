
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  getAllCampaigns,
  getUserCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  withdrawCampaignFunds,
} = require('../controllers/campaignController');

// 📦 Public routes
router.get('/', getAllCampaigns);

// 🔒 Protected routes
router.get('/my', protect, getUserCampaigns);         // must come before '/:id' to avoid conflict
router.get('/:id', getCampaignById);
router.post('/', protect, upload.single('image'), createCampaign);
router.put('/:id', protect, upload.single('image'), updateCampaign);
router.delete('/:id', protect, deleteCampaign);
router.post('/:id/withdraw', protect, withdrawCampaignFunds);

module.exports = router;
