// const express = require('express');
// const router = express.Router();
// const Campaign = require('../models/Campaign');
// const authMiddleware = require('../middleware/authMiddleware');

// // Create campaign - protected
// router.post('/', authMiddleware.protect, async (req, res) => {
//   try {
//     const { title, description, goalAmount } = req.body;

//     if (!title || !description || !goalAmount) {
//       return res.status(400).json({ message: 'Please provide all required fields' });
//     }

//     const campaign = await Campaign.create({
//       title,
//       description,
//       goalAmount,
//       owner: req.user.id,
//     });

//     res.status(201).json(campaign);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get all campaigns (public)
// router.get('/', async (req, res) => {
//   try {
//     const campaigns = await Campaign.find().populate('owner', 'name email');
//     res.json(campaigns);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get single campaign by id (public)
// router.get('/:id', async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id).populate('owner', 'name email');
//     if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
//     res.json(campaign);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update campaign - only owner or admin
// router.put('/:id', authMiddleware.protect, async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

//     if (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to update this campaign' });
//     }

//     const { title, description, goalAmount, status } = req.body;

//     if (title) campaign.title = title;
//     if (description) campaign.description = description;
//     if (goalAmount !== undefined) campaign.goalAmount = goalAmount;
//     if (status) campaign.status = status;

//     await campaign.save();

//     res.json(campaign);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete campaign - only owner or admin
// router.delete('/:id', authMiddleware.protect, async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

//     if (campaign.owner.toString() !== req.user.id && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to delete this campaign' });
//     }

//     await campaign.remove();

//     res.json({ message: 'Campaign deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;




const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // ✅ added

const {
  getAllCampaigns,
  getUserCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');

// 🌍 Public: Get all active campaigns
router.get('/', getAllCampaigns);

// 🔒 Protected: Get campaigns owned by the logged-in user
router.get('/my', protect, getUserCampaigns);

// 🌍 Public: Get a single campaign by ID (placed after '/my' to avoid conflicts)
router.get('/:id', getCampaignById);

// 🔒 Protected: Create a new campaign with image upload
router.post('/', protect, upload.single('image'), createCampaign); // ✅ added upload middleware

// 🔒 Protected: Update a campaign (ownership check handled in controller)
router.put('/:id', protect, upload.single('image'), updateCampaign); // ✅ added upload middleware

// 🔒 Protected: Delete a campaign (ownership check handled in controller)
router.delete('/:id', protect, deleteCampaign);

module.exports = router;
