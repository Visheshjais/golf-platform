// ============================================================
// controllers/winnerController.js
// Winner proof upload, admin verification, payout tracking
// ============================================================

const Winner = require('../models/Winner');
const User   = require('../models/User');

// ─── GET /api/winners/my ──────────────────────────────────────
// Returns all wins for the currently logged-in user
const getMyWinnings = async (req, res) => {
  try {
    const winners = await Winner.find({ user: req.user._id })
      .populate('draw', 'drawMonth drawYear drawnNumbers')
      .sort({ createdAt: -1 });

    res.json({ winners });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch winnings' });
  }
};

// ─── POST /api/winners/:id/proof ──────────────────────────────
// User submits proof URL (screenshot URL) for their win
const submitProof = async (req, res) => {
  try {
    const { proofUrl } = req.body;
    if (!proofUrl) return res.status(400).json({ message: 'Proof URL is required' });

    const winner = await Winner.findOne({
      _id:  req.params.id,
      user: req.user._id, // ensure user owns this winner record
    });

    if (!winner) return res.status(404).json({ message: 'Winner record not found' });

    if (winner.verificationStatus !== 'awaiting_proof') {
      return res.status(400).json({ message: 'Proof already submitted or review in progress' });
    }

    winner.proofUrl         = proofUrl;
    winner.proofSubmitted   = true;
    winner.proofSubmittedAt = new Date();
    winner.verificationStatus = 'under_review';
    await winner.save();

    res.json({ message: 'Proof submitted successfully. Awaiting admin review.', winner });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit proof' });
  }
};

// ─── GET /api/winners (admin) ─────────────────────────────────
// Admin views all winner records
const getAllWinners = async (req, res) => {
  try {
    const { status } = req.query; // optional filter by verificationStatus

    const filter = status ? { verificationStatus: status } : {};

    const winners = await Winner.find(filter)
      .populate('user', 'name email')
      .populate('draw', 'drawMonth drawYear drawnNumbers')
      .sort({ createdAt: -1 });

    res.json({ winners });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch winners' });
  }
};

// ─── PUT /api/winners/:id/verify (admin) ──────────────────────
// Admin approves or rejects proof
const verifyWinner = async (req, res) => {
  try {
    const { decision, adminNotes } = req.body; // decision: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    const winner = await Winner.findById(req.params.id);
    if (!winner) return res.status(404).json({ message: 'Winner not found' });

    winner.verificationStatus = decision;
    winner.adminNotes         = adminNotes || '';
    winner.reviewedBy         = req.user._id;
    winner.reviewedAt         = new Date();
    await winner.save();

    res.json({ message: `Winner ${decision}`, winner });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ─── PUT /api/winners/:id/payout (admin) ──────────────────────
// Admin marks prize as paid
const markPaid = async (req, res) => {
  try {
    const winner = await Winner.findById(req.params.id);
    if (!winner) return res.status(404).json({ message: 'Winner not found' });

    if (winner.verificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Winner must be approved before marking as paid' });
    }

    winner.paymentStatus = 'paid';
    winner.paidAt        = new Date();
    await winner.save();

    res.json({ message: 'Prize marked as paid', winner });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as paid' });
  }
};

module.exports = { getMyWinnings, submitProof, getAllWinners, verifyWinner, markPaid };
