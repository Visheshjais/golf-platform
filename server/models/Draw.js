// ============================================================
// models/Draw.js — Monthly draw document
// Stores the 5-number draw result + prize pool breakdown
// ============================================================

const mongoose = require('mongoose');

// Sub-schema for each prize tier result
const tierResultSchema = new mongoose.Schema({
  matchCount:  { type: Number, required: true }, // 3, 4, or 5
  poolPercent: { type: Number, required: true }, // 25, 35, or 40
  poolAmount:  { type: Number, required: true }, // calculated £ amount
  winners: [{
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prizeAmount:   { type: Number }, // pool / number of winners
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  }],
  isRollover: { type: Boolean, default: false }, // only true for 5-match jackpot
}, { _id: false });

const drawSchema = new mongoose.Schema({
  // ── Draw numbers ──────────────────────────────────────────
  // The 5 numbers drawn this month (each between 1–45)
  drawnNumbers: {
    type:     [Number],
    required: true,
    validate: {
      validator: (v) => v.length === 5,
      message:   'Exactly 5 numbers must be drawn',
    },
  },

  // ── Draw type ─────────────────────────────────────────────
  drawType: {
    type:    String,
    enum:    ['random', 'algorithmic'], // random = lottery style, algorithmic = weighted by score frequency
    default: 'random',
  },

  // ── Prize pool ────────────────────────────────────────────
  totalPool:          { type: Number, required: true }, // total £ in pot this month
  jackpotRollover:    { type: Number, default: 0 },     // carried from previous month
  activeSubscribers:  { type: Number, required: true }, // snapshot at draw time

  // ── Results per tier ─────────────────────────────────────
  tierResults: [tierResultSchema],

  // ── Status ────────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['simulation', 'pending', 'published'],
    default: 'simulation',
    // simulation = admin preview only
    // pending    = drawn but not yet published
    // published  = visible to all users
  },

  // ── Draw period ───────────────────────────────────────────
  drawMonth: { type: Number, required: true }, // 1–12
  drawYear:  { type: Number, required: true }, // e.g. 2025

  // ── Metadata ──────────────────────────────────────────────
  drawnBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who ran it
  publishedAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Draw', drawSchema);
