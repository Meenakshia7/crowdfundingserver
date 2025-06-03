
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // multer middleware

// ======= User management routes =======
router.get('/users', protect, admin, adminController.getAllUsers);
router.put('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);
router.get('/stats', protect, admin, adminController.getSystemStats);

// ======= Campaign management routes =======
router.get('/campaigns', protect, admin, adminController.getAllCampaigns);
router.get('/campaigns/pending', protect, admin, adminController.getPendingCampaignsDetailed);
router.put('/campaigns/:id/approve', protect, admin, adminController.approveCampaign);
router.put('/campaigns/:id/reject', protect, admin, adminController.rejectCampaign);

// Updated to handle image upload
router.put('/campaigns/:id', protect, admin, upload.single('image'), adminController.editCampaign);

router.delete('/campaigns/:id', protect, admin, adminController.deleteCampaign);

module.exports = router;
