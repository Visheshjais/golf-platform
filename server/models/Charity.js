// ============================================================
// models/Charity.js — Charity document schema
// ============================================================

const mongoose = require('mongoose');

// Sub-schema for upcoming charity events (e.g. golf days)
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  date:        { type: Date,   required: true },
  location:    { type: String },
}, { _id: true });

const charitySchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────
  name: {
    type:     String,
    required: [true, 'Charity name is required'],
    trim:     true,
    unique:   true,
  },
  description: {
    type:     String,
    required: [true, 'Description is required'],
  },
  shortDescription: {
    type:   String,
    maxlength: 160, // For charity directory cards
  },

  // ── Media ─────────────────────────────────────────────────
  logoUrl:   { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  images:    [{ type: String }], // Array of image URLs

  // ── Contact ───────────────────────────────────────────────
  website:   { type: String, default: '' },
  email:     { type: String, default: '' },

  // ── Events ────────────────────────────────────────────────
  events: {
    type:    [eventSchema],
    default: [],
  },

  // ── Admin flags ───────────────────────────────────────────
  isFeatured: {
    type:    Boolean,
    default: false, // Featured charities appear on homepage
  },
  isActive: {
    type:    Boolean,
    default: true,  // Inactive charities hidden from users
  },

  // ── Stats (calculated) ────────────────────────────────────
  // Total amount donated to this charity across all subscribers
  totalDonated: {
    type:    Number,
    default: 0,
  },
  // Number of subscribers currently supporting this charity
  subscriberCount: {
    type:    Number,
    default: 0,
  },

}, { timestamps: true });

module.exports = mongoose.model('Charity', charitySchema);
