// ============================================================
// utils/generateToken.js — Create a signed JWT for a user
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Generates a JWT containing the user's id and role.
 * @param {string} id   - MongoDB user _id
 * @param {string} role - 'user' | 'admin'
 * @returns {string}    - signed JWT string
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },                      // payload
    process.env.JWT_SECRET,            // secret from .env
    { expiresIn: '30d' }               // token valid for 30 days
  );
};

module.exports = generateToken;
