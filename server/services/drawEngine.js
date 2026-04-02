// ============================================================
// services/drawEngine.js
// Core draw algorithm supporting two modes:
//   1. random      — standard lottery-style draw
//   2. algorithmic — weighted by user score frequency
//
// Score range: 1–45 (Stableford format)
// Draw: selects 5 unique numbers from that range
// ============================================================

const User = require('../models/User');

/**
 * Generate 5 unique random numbers between 1 and 45.
 * Pure lottery — every number has equal probability.
 *
 * @returns {number[]} sorted array of 5 unique numbers
 */
const randomDraw = () => {
  const pool    = Array.from({ length: 45 }, (_, i) => i + 1); // [1, 2, ..., 45]
  const drawn   = [];

  while (drawn.length < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool[idx]);
    pool.splice(idx, 1); // remove picked number so it can't be picked again
  }

  return drawn.sort((a, b) => a - b); // sorted ascending
};

/**
 * Generate 5 numbers weighted by frequency of active users' scores.
 * Numbers that appear more often in users' scores have HIGHER draw probability.
 * This makes the draw feel connected to actual gameplay.
 *
 * @returns {number[]} sorted array of 5 unique numbers
 */
const algorithmicDraw = async () => {
  // ── Step 1: collect all scores from active subscribers ─────
  const users = await User.find({ subscriptionStatus: 'active' }).select('scores');

  // Build a frequency map: { 1: 3, 5: 7, 12: 2, ... }
  const frequency = {};
  for (let n = 1; n <= 45; n++) frequency[n] = 1; // baseline weight of 1 for each number

  users.forEach((user) => {
    user.scores.forEach((score) => {
      if (score.points >= 1 && score.points <= 45) {
        frequency[score.points] = (frequency[score.points] || 0) + 1;
      }
    });
  });

  // ── Step 2: build a weighted pool ──────────────────────────
  // Each number appears in the pool proportional to its frequency
  // e.g. if score 28 appears 10 times, it gets 10 slots in the pool
  const weightedPool = [];
  for (let n = 1; n <= 45; n++) {
    for (let w = 0; w < frequency[n]; w++) {
      weightedPool.push(n);
    }
  }

  // ── Step 3: pick 5 unique numbers from weighted pool ───────
  const drawn = new Set();
  let attempts = 0;

  while (drawn.size < 5 && attempts < 10000) {
    const idx = Math.floor(Math.random() * weightedPool.length);
    drawn.add(weightedPool[idx]);
    attempts++;
  }

  // Safety fallback: if weighted pool somehow failed, use random
  if (drawn.size < 5) {
    return randomDraw();
  }

  return [...drawn].sort((a, b) => a - b);
};

/**
 * matchUserScores — checks how many of a user's scores match the drawn numbers.
 * A user's 5 score values are compared against the 5 drawn numbers.
 * "Match" means the score value exists in drawnNumbers.
 *
 * @param {number[]} userScores   - array of score point values (e.g. [18, 22, 30, 14, 9])
 * @param {number[]} drawnNumbers - the 5 drawn numbers
 * @returns {number} - count of matches (0–5)
 */
const matchUserScores = (userScores, drawnNumbers) => {
  const drawnSet = new Set(drawnNumbers);
  let matches = 0;

  userScores.forEach((score) => {
    if (drawnSet.has(score)) matches++;
  });

  return matches;
};

/**
 * runDraw — the main draw runner called by the draw controller.
 * Generates draw numbers + finds all winners across all tiers.
 *
 * @param {string}   drawType - 'random' or 'algorithmic'
 * @param {number}   rollover - jackpot rollover amount from last month (£)
 * @param {number}   pricePerSub - subscription fee per user (£)
 * @param {number}   prizePoolPercent - % of each subscription going to prize pool
 * @returns {object} { drawnNumbers, tierResults, totalPool, activeSubscribers }
 */
const runDraw = async (drawType, rollover = 0, pricePerSub = 9.99, prizePoolPercent = 50) => {
  // ── Step 1: generate the 5 drawn numbers ───────────────────
  const drawnNumbers = drawType === 'algorithmic'
    ? await algorithmicDraw()
    : randomDraw();

  // ── Step 2: find all active subscribers with 5 scores ──────
  const users = await User.find({
    subscriptionStatus: 'active',
    $expr: { $eq: [{ $size: '$scores' }, 5] }, // only users who have entered all 5 scores
  }).select('scores name email');

  const activeSubscribers = users.length;

  // ── Step 3: calculate total prize pool ─────────────────────
  const totalSubscriptionRevenue = activeSubscribers * pricePerSub;
  const basePrizePool = totalSubscriptionRevenue * (prizePoolPercent / 100);
  const totalPool = basePrizePool + rollover; // add any jackpot rollover

  // Prize split per PRD:
  // 5-match: 40% (jackpot, rolls over if no winner)
  // 4-match: 35%
  // 3-match: 25%
  const tierConfig = [
    { matchCount: 5, poolPercent: 40, isJackpot: true },
    { matchCount: 4, poolPercent: 35, isJackpot: false },
    { matchCount: 3, poolPercent: 25, isJackpot: false },
  ];

  // ── Step 4: find winners for each tier ─────────────────────
  const tierResults = [];

  for (const tier of tierConfig) {
    const tierPool = parseFloat(((totalPool * tier.poolPercent) / 100).toFixed(2));
    const tierWinners = [];

    users.forEach((user) => {
      const userScoreValues = user.scores.map((s) => s.points);
      const matches = matchUserScores(userScoreValues, drawnNumbers);

      if (matches === tier.matchCount) {
        tierWinners.push({ user: user._id });
      }
    });

    // Split prize equally among winners in this tier
    const prizePerWinner = tierWinners.length > 0
      ? parseFloat((tierPool / tierWinners.length).toFixed(2))
      : 0;

    const isRollover = tier.isJackpot && tierWinners.length === 0; // jackpot rolls over

    tierResults.push({
      matchCount:  tier.matchCount,
      poolPercent: tier.poolPercent,
      poolAmount:  tierPool,
      winners:     tierWinners.map((w) => ({ ...w, prizeAmount: prizePerWinner })),
      isRollover,
    });
  }

  return {
    drawnNumbers,
    tierResults,
    totalPool: parseFloat(totalPool.toFixed(2)),
    activeSubscribers,
  };
};

module.exports = { runDraw, randomDraw, algorithmicDraw, matchUserScores };
