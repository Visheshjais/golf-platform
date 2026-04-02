// ============================================================
// routes/winnerRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { getMyWinnings, submitProof, getAllWinners, verifyWinner, markPaid } = require('../controllers/winnerController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/my',              protect, getMyWinnings);
router.post('/:id/proof',      protect, submitProof);
router.get('/',                protect, adminOnly, getAllWinners);
router.put('/:id/verify',      protect, adminOnly, verifyWinner);
router.put('/:id/payout',      protect, adminOnly, markPaid);

module.exports = router;
