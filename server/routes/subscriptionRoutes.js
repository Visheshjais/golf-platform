// ============================================================
// routes/subscriptionRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { createCheckout, createPortal, getStatus, handleWebhook } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Webhook: raw body is handled in server.js, NO protect middleware
router.post('/webhook', handleWebhook);

router.post('/create-checkout', protect, createCheckout);
router.post('/portal',          protect, createPortal);
router.get('/status',           protect, getStatus);

module.exports = router;
