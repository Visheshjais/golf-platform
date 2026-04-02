// ============================================================
// models/User.js — User document schema
// Scores are embedded here (array of last 5 scores max)
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Sub-schema for a single golf score entry
const scoreSchema = new mongoose.Schema({
  points: {
    type:     Number,
    required: true,
    min:      1,    // Stableford min
    max:      45,   // Stableford max per PRD
  },
  date: {
    type:     Date,
    required: true,
  },
}, { _id: true });

const userSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/\S+@\S+\.\S+/, 'Please enter a valid email'],
  },
  password: {
    type:     String,
    required: [true, 'Password is required'],
    minlength: 6,
    select:   false, // Never return password in queries by default
  },

  // ── Role ──────────────────────────────────────────────────
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user',
  },

  // ── Subscription state ────────────────────────────────────
  // These are managed by Stripe webhook events
  stripeCustomerId:     { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: {
    type:    String,
    enum:    ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
    default: 'inactive',
  },
  subscriptionPlan: {
    type:    String,
    enum:    ['monthly', 'yearly', null],
    default: null,
  },
  subscriptionRenewalDate: { type: Date, default: null },

  // ── Scores (rolling last 5) ───────────────────────────────
  // The business logic to keep only 5 scores is in the controller
  scores: {
    type:    [scoreSchema],
    default: [],
    // Validation: enforce max 5 scores in the array
    validate: {
      validator: (v) => v.length <= 5,
      message:   'A user can have at most 5 scores stored',
    },
  },

  // ── Charity selection ─────────────────────────────────────
  selectedCharity: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Charity',
    default: null,
  },
  // Percentage of subscription going to charity (min 10%)
  charityContributionPercent: {
    type:    Number,
    default: 10,
    min:     10,
    max:     100,
  },

  // ── Draws ─────────────────────────────────────────────────
  drawsEntered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Draw' }],

  // ── Timestamps ────────────────────────────────────────────
}, { timestamps: true }); // adds createdAt + updatedAt automatically

// ─── Pre-save hook: hash password before storing ──────────────
userSchema.pre('save', async function (next) {
  // Only re-hash if the password was actually modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare entered password with hash ───────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
