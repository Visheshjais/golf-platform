// ============================================================
// controllers/adminController.js
// Admin-only: user management, reports, analytics
// ============================================================

const User    = require('../models/User');
const Draw    = require('../models/Draw');
const Winner  = require('../models/Winner');
const Charity = require('../models/Charity');

// ─── GET /api/admin/stats ─────────────────────────────────────
// Summary numbers for the admin dashboard
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscribers,
      totalCharities,
      totalDraws,
      pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionStatus: 'active' }),
      Charity.countDocuments({ isActive: true }),
      Draw.countDocuments({ status: 'published' }),
      Winner.countDocuments({ verificationStatus: 'under_review' }),
    ]);

    // Total prize pool distributed (sum of all published draw totalPool)
    const poolResult = await Draw.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, total: { $sum: '$totalPool' } } },
    ]);
    const totalPoolDistributed = poolResult[0]?.total || 0;

    // Total charity contributions (approximated as charityContributionPercent × subscription fee)
    // Real calculation would need actual payment records
    const charityResult = await User.aggregate([
      { $match: { subscriptionStatus: 'active' } },
      { $group: { _id: null, avgPercent: { $avg: '$charityContributionPercent' } } },
    ]);
    const avgCharityPercent = charityResult[0]?.avgPercent || 10;

    res.json({
      totalUsers,
      activeSubscribers,
      totalCharities,
      totalDraws,
      pendingVerifications,
      totalPoolDistributed: totalPoolDistributed.toFixed(2),
      avgCharityContribution: avgCharityPercent.toFixed(1),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.subscriptionStatus = status;

    const users = await User.find(filter)
      .select('-password')
      .populate('selectedCharity', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ─── PUT /api/admin/users/:id ─────────────────────────────────
// Admin can edit user scores or subscription status manually
const updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'subscriptionStatus', 'subscriptionPlan', 'scores', 'role'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

module.exports = { getStats, getUsers, updateUser };
