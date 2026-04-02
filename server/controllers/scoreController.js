// ============================================================
// controllers/scoreController.js
// Manages the rolling 5-score system per the PRD:
// - Only last 5 scores kept
// - New score replaces the OLDEST one when array is full
// - Scores displayed in reverse chronological order
// ============================================================

const User = require('../models/User');

// ─── POST /api/scores — Add a new score ───────────────────────
const addScore = async (req, res) => {
  try {
    const { points, date } = req.body;

    // Validate score range (Stableford: 1–45)
    if (!points || points < 1 || points > 45) {
      return res.status(400).json({ message: 'Score must be between 1 and 45 (Stableford)' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Score date is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newScore = { points: Number(points), date: new Date(date) };

    if (user.scores.length >= 5) {
      // ── Rolling logic: find and remove the OLDEST score ────
      // Sort by date ascending, the first one is the oldest
      user.scores.sort((a, b) => new Date(a.date) - new Date(b.date));
      user.scores.shift(); // remove oldest
    }

    // Add the new score
    user.scores.push(newScore);

    await user.save();

    // Return scores sorted newest first (as required by PRD)
    const sortedScores = [...user.scores].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(201).json({
      message: 'Score added successfully',
      scores: sortedScores,
    });
  } catch (error) {
    console.error('Add score error:', error);
    res.status(500).json({ message: 'Failed to add score', error: error.message });
  }
};

// ─── GET /api/scores — Get all scores for logged-in user ──────
const getMyScores = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('scores');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return newest first
    const sorted = [...user.scores].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({ scores: sorted });
  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
};

// ─── PUT /api/scores/:scoreId — Edit a specific score ─────────
const editScore = async (req, res) => {
  try {
    const { points, date } = req.body;
    const { scoreId }      = req.params;

    if (points && (points < 1 || points > 45)) {
      return res.status(400).json({ message: 'Score must be between 1 and 45' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the score subdocument by its _id
    const score = user.scores.id(scoreId);
    if (!score) return res.status(404).json({ message: 'Score not found' });

    // Update only provided fields
    if (points) score.points = Number(points);
    if (date)   score.date   = new Date(date);

    await user.save();

    const sorted = [...user.scores].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({ message: 'Score updated', scores: sorted });
  } catch (error) {
    console.error('Edit score error:', error);
    res.status(500).json({ message: 'Failed to update score' });
  }
};

// ─── DELETE /api/scores/:scoreId — Remove a score ─────────────
const deleteScore = async (req, res) => {
  try {
    const { scoreId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const score = user.scores.id(scoreId);
    if (!score) return res.status(404).json({ message: 'Score not found' });

    score.deleteOne();
    await user.save();

    res.json({ message: 'Score deleted', scores: user.scores });
  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({ message: 'Failed to delete score' });
  }
};

module.exports = { addScore, getMyScores, editScore, deleteScore };
