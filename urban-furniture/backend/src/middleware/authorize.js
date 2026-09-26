const prisma = require('../config/database');

/**
 * Role Authorization Middleware
 * 
 * Accepts one or more allowed roles.
 * Checks the authenticated user's role against the allowed list.
 * Returns 403 if the user's role is not permitted.
 * 
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'ACCOUNTANT')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.',
      });
    }

    next();
  };
};

/**
 * Accountant Type Authorization Middleware
 * 
 * Validates that the authenticated accountant has the required accountantType.
 * Must be used AFTER authenticate and authorize('ACCOUNTANT').
 * 
 * Usage: authorizeAccountantType('SALES') or authorizeAccountantType('PURCHASE')
 */
const authorizeAccountantType = (...allowedTypes) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'ACCOUNTANT') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Accountant role required.',
        });
      }

      // Fetch accountant profile to get accountantType
      const accountant = await prisma.accountant.findUnique({
        where: { userId: req.user.userId },
        select: { accountantType: true, accountantCode: true, id: true },
      });

      if (!accountant) {
        return res.status(403).json({
          success: false,
          message: 'Accountant profile not found.',
        });
      }

      if (!allowedTypes.includes(accountant.accountantType)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This resource is restricted to ${allowedTypes.join(' or ')} accountants.`,
        });
      }

      // Attach accountant info to request for downstream use
      req.accountant = accountant;

      next();
    } catch (error) {
      console.error('Accountant type authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.',
      });
    }
  };
};

const { PERMISSION_DESCRIPTIONS } = require('../constants/permissions');

/**
 * Granular Permission Authorization Middleware
 * 
 * - ADMIN role automatically bypasses all permission checks (full access).
 * - For ACCOUNTANT, checks whether user possesses the required permission(s).
 * - If multiple permissions are passed, user must have at least one of them.
 * - Returns 403 Forbidden with `{ success: false, message: "You do not have permission to <action>." }`
 */
const requirePermission = (...permissionKeys) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admin has full system access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Accountant role required.',
      });
    }

    const userPerms = req.user.permissions || [];
    const hasPerm = permissionKeys.some((key) => userPerms.includes(key));

    if (!hasPerm) {
      const primaryKey = permissionKeys[0];
      const actionDesc = PERMISSION_DESCRIPTIONS[primaryKey] || primaryKey.toLowerCase().replace(/_/g, ' ');
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${actionDesc}.`,
      });
    }

    next();
  };
};

module.exports = { authorize, authorizeAccountantType, requirePermission };
