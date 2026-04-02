// ============================================================
// middleware/subscriptionGuard.js
// Blocks access to premium features if subscription is inactive
// ============================================================

/**
 * requireSubscription — must be used AFTER protect middleware.
 * Only lets through users with an active (or trialing) subscription.
 */
const requireSubscription = (req, res, next) => {
  const allowed = ['active', 'trialing'];

  if (req.user && allowed.includes(req.user.subscriptionStatus)) {
    return next();
  }

  return res.status(403).json({
    message: 'An active subscription is required to access this feature.',
    code: 'SUBSCRIPTION_REQUIRED',
  });
};

module.exports = { requireSubscription };
