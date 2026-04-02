// ============================================================
// routes/scoreRoutes.js
// All score routes require: auth + active subscription
// ============================================================
const express = require('express');
const router  = express.Router();
const { addScore, getMyScores, editScore, deleteScore } = require('../controllers/scoreController');
const { protect }              = require('../middleware/authMiddleware');
const { requireSubscription }  = require('../middleware/subscriptionGuard');

// Apply both middlewares to all score routes
router.use(protect, requireSubscription);

router.get('/',               getMyScores);
router.post('/',              addScore);
router.put('/:scoreId',       editScore);
router.delete('/:scoreId',    deleteScore);

module.exports = router;
