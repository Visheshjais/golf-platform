// ============================================================
// models/Winner.js — Winner verification record
// Created when a draw is published and a user wins
// ============================================================

const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  draw:  { type: mongoose.Schema.Types.ObjectId, ref: 'Draw',  required: true },

  // Which tier they won
  matchCount:  { type: Number, enum: [3, 4, 5], required: true },
  prizeAmount: { type: Number, required: true }, // £ amount

  // ── Proof upload ──────────────────────────────────────────
  // User must upload a screenshot of their golf platform scores
  proofUrl:       { type: String, default: null }, // URL to uploaded file
  proofSubmitted: { type: Boolean, default: false },
  proofSubmittedAt: { type: Date, default: null },

  // ── Admin review ──────────────────────────────────────────
  verificationStatus: {
    type:    String,
    enum:    ['awaiting_proof', 'under_review', 'approved', 'rejected'],
    default: 'awaiting_proof',
  },
  adminNotes:    { type: String, default: '' },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:    { type: Date, default: null },

  // ── Payment ───────────────────────────────────────────────
  paymentStatus: {
    type:    String,
    enum:    ['pending', 'paid'],
    default: 'pending',
  },
  paidAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Winner', winnerSchema);
