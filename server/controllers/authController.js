// ============================================================
// controllers/authController.js
// Handles user registration, login, and profile fetching
// ============================================================

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');

// ─── POST /api/auth/register ──────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate all fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if email is already registered
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Create user — password is hashed automatically in the User model pre-save hook
    const user = await User.create({ name, email, password });

    // Return user data + JWT
    res.status(201).json({
      _id:                user._id,
      name:               user.name,
      email:              user.email,
      role:               user.role,
      subscriptionStatus: user.subscriptionStatus,
      token:              generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Need to explicitly select password since schema has select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Use the model method to compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id:                user._id,
      name:               user.name,
      email:              user.email,
      role:               user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan:   user.subscriptionPlan,
      token:              generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────
// Returns the currently authenticated user's profile
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id)
      .populate('selectedCharity', 'name logoUrl')  // include charity details
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Could not fetch profile' });
  }
};

// ─── PUT /api/auth/me ─────────────────────────────────────────
// Update profile (name, charity selection, contribution percentage)
const updateProfile = async (req, res) => {
  try {
    const { name, selectedCharity, charityContributionPercent } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update fields that were actually sent
    if (name)                         user.name = name;
    if (selectedCharity !== undefined) user.selectedCharity = selectedCharity;
    if (charityContributionPercent !== undefined) {
      // Enforce minimum 10%
      if (charityContributionPercent < 10) {
        return res.status(400).json({ message: 'Minimum charity contribution is 10%' });
      }
      user.charityContributionPercent = charityContributionPercent;
    }

    const updated = await user.save();
    res.json({
      _id:                        updated._id,
      name:                       updated.name,
      email:                      updated.email,
      selectedCharity:            updated.selectedCharity,
      charityContributionPercent: updated.charityContributionPercent,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Could not update profile' });
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile };
