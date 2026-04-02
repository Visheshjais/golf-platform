// ============================================================
// middleware/authMiddleware.js — Protect routes with JWT
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies the Bearer token in Authorization header.
 * Attaches req.user if valid, returns 401 if not.
 */
const protect = async (req, res, next) => {
  let token;

  // JWT comes as: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify signature + expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('JWT error:', error.message);
      return res.status(401).json({ message: 'Not authorised, token invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorised, no token provided' });
  }
};

module.exports = { protect };
