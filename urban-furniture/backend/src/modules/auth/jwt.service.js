const jwt = require('jsonwebtoken');
const env = require('../../config/env');

/**
 * Generate a JWT token
 * @param {Object} payload - { userId, role }
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
