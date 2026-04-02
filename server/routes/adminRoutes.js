// ============================================================
// routes/adminRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { getStats, getUsers, updateUser } = require('../controllers/adminController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly); // all admin routes protected

router.get('/stats',       getStats);
router.get('/users',       getUsers);
router.put('/users/:id',   updateUser);

module.exports = router;
