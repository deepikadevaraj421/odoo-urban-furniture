const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/database');

/**
 * Authentication Middleware
 * 
 * - Extracts JWT from Authorization: Bearer <token> header
 * - Verifies token validity
 * - Attaches authenticated user info to req.user
 * - Returns 401 for missing/invalid/expired tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Token is empty.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact administrator.',
      });
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

module.exports = authenticate;
