const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserDashboardOverview } = require('../controllers/userController');

const router = express.Router();

router.get('/dashboard', protect, getUserDashboardOverview);

module.exports = router;
