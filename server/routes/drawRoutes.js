// ============================================================
// routes/drawRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { simulateDraw, executeDraw, publishDraw, getDraws, getDrawById } = require('../controllers/drawController');
const { protect }    = require('../middleware/authMiddleware');
const { adminOnly }  = require('../middleware/adminMiddleware');

router.get('/',                   protect, getDraws);
router.get('/:id',                protect, getDrawById);
router.post('/simulate',          protect, adminOnly, simulateDraw);
router.post('/run',               protect, adminOnly, executeDraw);
router.post('/:id/publish',       protect, adminOnly, publishDraw);

module.exports = router;
