const express = require('express');
const router  = express.Router();
const { getCharities, getCharityById, createCharity, updateCharity, deleteCharity, donateToCharity } = require('../controllers/charityController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/',              getCharities);      // public
router.get('/:id',           getCharityById);   // public
// Independent donation — open to public (logged-in or anonymous)
router.post('/:id/donate',   donateToCharity);  // public
router.post('/',             protect, adminOnly, createCharity);
router.put('/:id',           protect, adminOnly, updateCharity);
router.delete('/:id',        protect, adminOnly, deleteCharity);

module.exports = router;
