// ============================================================
// middleware/adminMiddleware.js — Restrict routes to admins
// ============================================================

/**
 * adminOnly — must be used AFTER protect middleware.
 * Checks req.user.role === 'admin'.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied — admin only' });
};

module.exports = { adminOnly };
