// ============================================================
// controllers/charityController.js
// Public: list/view charities. Admin: create/edit/delete.
// ============================================================

const Charity = require('../models/Charity');
const User    = require('../models/User');

// ─── GET /api/charities ───────────────────────────────────────
// Public — list all active charities with optional search/filter
const getCharities = async (req, res) => {
  try {
    const { search, featured } = req.query;

    const filter = { isActive: true };

    // Featured filter (for homepage spotlight)
    if (featured === 'true') filter.isFeatured = true;

    // Text search on name and description
    if (search) {
      filter.$or = [
        { name:             { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const charities = await Charity.find(filter)
      .select('name shortDescription logoUrl isFeatured subscriberCount totalDonated')
      .sort({ isFeatured: -1, subscriberCount: -1 }); // featured first, then by popularity

    res.json({ charities });
  } catch (error) {
    console.error('Get charities error:', error);
    res.status(500).json({ message: 'Failed to fetch charities' });
  }
};

// ─── GET /api/charities/:id ───────────────────────────────────
// Public — full detail of a single charity
const getCharityById = async (req, res) => {
  try {
    const charity = await Charity.findOne({ _id: req.params.id, isActive: true });
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    res.json({ charity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch charity' });
  }
};

// ─── POST /api/charities (admin) ─────────────────────────────
const createCharity = async (req, res) => {
  try {
    const { name, description, shortDescription, logoUrl, bannerUrl, website, email, isFeatured } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const charity = await Charity.create({
      name, description, shortDescription, logoUrl,
      bannerUrl, website, email, isFeatured: isFeatured || false,
    });

    res.status(201).json({ message: 'Charity created', charity });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A charity with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create charity', error: error.message });
  }
};

// ─── PUT /api/charities/:id (admin) ──────────────────────────
const updateCharity = async (req, res) => {
  try {
    const allowed = [
      'name','description','shortDescription','logoUrl',
      'bannerUrl','website','email','isFeatured','isActive','events'
    ];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    res.json({ message: 'Charity updated', charity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update charity' });
  }
};

// ─── DELETE /api/charities/:id (admin) ───────────────────────
// Soft delete — sets isActive: false (preserves history)
const deleteCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    // Remove this charity from any users who had it selected
    await User.updateMany(
      { selectedCharity: req.params.id },
      { selectedCharity: null }
    );

    res.json({ message: 'Charity deactivated', charity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete charity' });
  }
};

// ─── POST /api/charities/:id/donate ──────────────────────────
// Independent one-off donation — not tied to subscription or gameplay.
// Records the donation amount against the charity's totalDonated counter.
// In production this would initiate a Stripe PaymentIntent; here we
// validate & persist the record so the full flow can be wired up.
const donateToCharity = async (req, res) => {
  try {
    const { amount, donorName, donorEmail, message } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A valid donation amount (£) is required' });
    }

    const charity = await Charity.findOne({ _id: req.params.id, isActive: true });
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    const donationAmount = parseFloat(Number(amount).toFixed(2));

    // Increment the charity's running total
    charity.totalDonated = (charity.totalDonated || 0) + donationAmount;
    await charity.save();

    // In a full build: create a Stripe PaymentIntent here and return client_secret.
    // For now we return a confirmation payload the frontend can display.
    res.status(201).json({
      message:    'Donation recorded — thank you!',
      charity:    charity.name,
      amount:     donationAmount,
      donorName:  donorName  || 'Anonymous',
      donorEmail: donorEmail || null,
      note:       message    || null,
    });
  } catch (error) {
    console.error('Donate error:', error);
    res.status(500).json({ message: 'Donation failed', error: error.message });
  }
};

module.exports = { getCharities, getCharityById, createCharity, updateCharity, deleteCharity, donateToCharity };
