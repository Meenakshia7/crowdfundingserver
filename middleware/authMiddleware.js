

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes and attach user to req
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
      console.error('protect middleware: Invalid decoded token payload', decoded);
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.warn(`protect middleware: User not found for ID ${decoded.id}`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Optional: block disabled/suspended users
    if (user.status === 'disabled') {
      console.warn(`protect middleware: User ${user.id} is disabled`);
      return res.status(403).json({ message: 'Account disabled, contact admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware: Token verification failed', error);
    return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
  }
};

// Middleware to allow only admin users
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  console.warn(`adminProtect middleware: User ${req.user ? req.user.id : 'unknown'} is not admin`);
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, admin };
