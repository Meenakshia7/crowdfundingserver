// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { protect } = require('../middleware/authMiddleware');

// // Utility: Generate JWT Token
// const generateToken = (id, role) => {
//   return jwt.sign({ id, role }, process.env.JWT_SECRET, {
//     expiresIn: '30d',
//   });
// };

// // @route   POST /api/users/register
// // @desc    Register a new user
// // @access  Public
// router.post('/register', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Please provide email and password' });
//     }

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       email,
//       password: hashedPassword,
//       role: 'user',
//     });

//     res.status(201).json({
//       _id: user._id,
//       email: user.email,
//       role: user.role,
//       token: generateToken(user._id, user.role),
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: 'Registration failed' });
//   }
// });

// // @route   POST /api/users/login
// // @desc    Authenticate user & get token
// // @access  Public
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Please provide email and password' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     res.status(200).json({
//       _id: user._id,
//       email: user.email,
//       role: user.role,
//       token: generateToken(user._id, user.role),
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Login failed' });
//   }
// });

// // @route   GET /api/users/profile
// // @desc    Get user profile (protected)
// // @access  Private
// router.get('/profile', protect, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     if (user) {
//       res.json(user);
//     } else {
//       res.status(404).json({ message: 'User not found' });
//     }
//   } catch (error) {
//     console.error('Profile error:', error);
//     res.status(500).json({ message: 'Fetching profile failed' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;


