

const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  getAllCampaigns,
  getUserCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  withdrawCampaignFunds,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,    // <-- add this
  editCampaign,      // <-- add this
} = require('../controllers/campaignController');

// 📦 Public routes
router.get('/', getAllCampaigns);

// 🔒 Protected user routes
router.get('/my', protect, getUserCampaigns);
router.post('/', protect, upload.single('image'), createCampaign);
router.put('/:id', protect, upload.single('image'), updateCampaign);
router.delete('/:id', protect, deleteCampaign);
router.post('/:id/withdraw', protect, withdrawCampaignFunds);

// 🛡️ Admin-only routes
router.get('/admin/pending', protect, admin, getPendingCampaigns);
router.put('/admin/campaigns/:id/approve', protect, admin, approveCampaign);
router.put('/admin/campaigns/:id/reject', protect, admin, rejectCampaign);
router.put('/admin/campaigns/:id', protect, admin, upload.single('image'), editCampaign);

// ⚠️ Place this at the bottom to avoid conflict with above routes
router.get('/:id', getCampaignById);

module.exports = router;
