// ============================================================
// controllers/drawController.js
// Admin runs draws, publishes results; users view published draws
// ============================================================

const Draw          = require('../models/Draw');
const Winner        = require('../models/Winner');
const User          = require('../models/User');
const { runDraw }   = require('../services/drawEngine');
const emailService  = require('../services/emailService');

// ─── POST /api/draws/simulate (admin) ────────────────────────
// Runs a preview draw — does NOT create winners, status = 'simulation'
const simulateDraw = async (req, res) => {
  try {
    const { drawType = 'random' } = req.body;

    // Get last draw's jackpot rollover
    const lastDraw = await Draw.findOne({ status: 'published' }).sort({ createdAt: -1 });
    const rollover = lastDraw
      ? lastDraw.tierResults.find(t => t.matchCount === 5 && t.isRollover)?.poolAmount || 0
      : 0;

    const result = await runDraw(drawType, rollover);

    res.json({
      message:           'Simulation complete (not saved)',
      drawnNumbers:      result.drawnNumbers,
      totalPool:         result.totalPool,
      activeSubscribers: result.activeSubscribers,
      tierResults:       result.tierResults,
    });
  } catch (error) {
    console.error('Simulate draw error:', error);
    res.status(500).json({ message: 'Simulation failed', error: error.message });
  }
};

// ─── POST /api/draws/run (admin) ──────────────────────────────
// Executes a real draw and saves it with status 'pending' (not yet published)
const executeDraw = async (req, res) => {
  try {
    const { drawType = 'random', drawMonth, drawYear } = req.body;

    if (!drawMonth || !drawYear) {
      return res.status(400).json({ message: 'drawMonth and drawYear are required' });
    }

    // Prevent running a draw for a month that already has one
    const existing = await Draw.findOne({ drawMonth, drawYear, status: { $ne: 'simulation' } });
    if (existing) {
      return res.status(409).json({ message: `A draw for ${drawMonth}/${drawYear} already exists` });
    }

    // Get rollover from previous jackpot if any
    const lastDraw = await Draw.findOne({ status: 'published' }).sort({ createdAt: -1 });
    const rollover = lastDraw
      ? lastDraw.tierResults.find(t => t.matchCount === 5 && t.isRollover)?.poolAmount || 0
      : 0;

    const result = await runDraw(drawType, rollover);

    // Save the draw to DB with 'pending' status (admin must publish separately)
    const draw = await Draw.create({
      drawnNumbers:      result.drawnNumbers,
      drawType,
      totalPool:         result.totalPool,
      jackpotRollover:   rollover,
      activeSubscribers: result.activeSubscribers,
      tierResults:       result.tierResults,
      drawMonth:         Number(drawMonth),
      drawYear:          Number(drawYear),
      drawnBy:           req.user._id,
      status:            'pending',
    });

    res.status(201).json({
      message: 'Draw executed and saved. Review and publish when ready.',
      draw,
    });
  } catch (error) {
    console.error('Execute draw error:', error);
    res.status(500).json({ message: 'Draw execution failed', error: error.message });
  }
};

// ─── POST /api/draws/:id/publish (admin) ──────────────────────
// Publishes a pending draw: creates Winner records and sends emails
const publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);

    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    if (draw.status === 'published') {
      return res.status(409).json({ message: 'Draw already published' });
    }

    // Create a Winner document for each winner in each tier
    for (const tier of draw.tierResults) {
      for (const winner of tier.winners) {
        await Winner.create({
          user:        winner.user,
          draw:        draw._id,
          matchCount:  tier.matchCount,
          prizeAmount: winner.prizeAmount,
        });

        // Send winner notification email
        const user = await User.findById(winner.user).select('email name');
        if (user) {
          await emailService.sendWinnerVerificationEmail(user, winner.prizeAmount);
        }
      }
    }

    // Mark draw as published
    draw.status      = 'published';
    draw.publishedAt = new Date();
    await draw.save();

    // Notify ALL subscribers of draw results (non-blocking)
    const allSubscribers = await User.find({ subscriptionStatus: 'active' }).select('email name');
    for (const sub of allSubscribers) {
      // Find if this user won anything
      const userWinner = await Winner.findOne({ user: sub._id, draw: draw._id });
      await emailService.sendDrawResultsEmail(sub, draw, userWinner?.prizeAmount || null);
    }

    res.json({ message: 'Draw published and emails sent', draw });
  } catch (error) {
    console.error('Publish draw error:', error);
    res.status(500).json({ message: 'Failed to publish draw' });
  }
};

// ─── GET /api/draws — List published draws (public-ish) ───────
const getDraws = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';

    // Admins see all statuses, users only see published
    const filter = isAdmin ? {} : { status: 'published' };

    const draws = await Draw.find(filter)
      .sort({ drawYear: -1, drawMonth: -1 })
      .limit(12); // last 12 months

    res.json({ draws });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch draws' });
  }
};

// ─── GET /api/draws/:id — Single draw detail ──────────────────
const getDrawById = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id)
      .populate('tierResults.winners.user', 'name email');

    if (!draw) return res.status(404).json({ message: 'Draw not found' });

    // Non-admins can only see published draws
    if (draw.status !== 'published' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Draw not yet published' });
    }

    res.json({ draw });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch draw' });
  }
};

module.exports = { simulateDraw, executeDraw, publishDraw, getDraws, getDrawById };
