// // server/routes/dashboardRoutes.js

// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/authMiddleware');

// // Controller function for dashboard data
// router.get('/', protect, async (req, res) => {
//   try {
//     // Example static dashboard data; you can replace this with real DB queries
//     const dashboardData = {
//       user: req.user.email,
//       campaigns: 3,
//       donations: 2500,
//       messages: 5,
//     };

//     res.json(dashboardData);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to load dashboard data' });
//   }
// });

// module.exports = router;





const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Campaign = require('../models/Campaign');
const Donation = require('../models/donation');

router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Count user’s campaigns
    const campaignCount = await Campaign.countDocuments({ owner: userId });

    // Sum user’s donations across campaigns
    const donations = await Donation.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const donationTotal = donations[0]?.total || 0;

    res.json({
      user: req.user.email,
      campaigns: campaignCount,
      donations: donationTotal,
      messages: 5, // You can replace with actual message count if implemented
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

module.exports = router;
  




//OPTIONAL CORRECTION REMOVE IF ANY ERROR OCCURS.