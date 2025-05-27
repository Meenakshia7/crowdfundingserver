// server/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controller function for dashboard data
router.get('/', protect, async (req, res) => {
  try {
    // Example static dashboard data; you can replace this with real DB queries
    const dashboardData = {
      user: req.user.email,
      campaigns: 3,
      donations: 2500,
      messages: 5,
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

module.exports = router;





