
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect middleware (requires login)
const protect = async (req, res, next) => {
  const getTokenFromHeader = () => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return null;
  };

  const token = getTokenFromHeader();

  if (!token) {
    console.warn('protect middleware: No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Account disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware: Token verification failed', error);
    return res.status(401).json({ message: 'Token failed', error: error.message });
  }
};

// Admin-only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// ✅ Optional auth middleware: attaches user if token valid, else sets req.user = null
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status !== 'disabled') {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = { protect, admin, optionalAuth };
