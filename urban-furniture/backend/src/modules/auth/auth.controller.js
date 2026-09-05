const { body } = require('express-validator');
const authService = require('./auth.service');
const validateRequest = require('../../middleware/validateRequest');

/**
 * POST /api/auth/login
 * Unified login endpoint
 */
const loginValidation = [
  body('loginType')
    .isIn(['ADMIN', 'ACCOUNTANT', 'CUSTOMER'])
    .withMessage('loginType must be ADMIN, ACCOUNTANT, or CUSTOMER.'),
  validateRequest,
];

const login = async (req, res, next) => {
  try {
    const { loginType, email, password, identifier, customerCode } = req.body;

    let result;

    switch (loginType) {
      case 'ADMIN':
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email and password are required for admin login.',
          });
        }
        result = await authService.loginAdmin(email, password);
        break;

      case 'ACCOUNTANT':
        const accIdentifier = email || identifier;
        if (!accIdentifier || !password) {
          return res.status(400).json({
            success: false,
            message: 'Registered Email/Accountant Code and password are required.',
          });
        }
        result = await authService.loginAccountant(accIdentifier, password);
        break;

      case 'CUSTOMER':
        if (!customerCode || !email) {
          return res.status(400).json({
            success: false,
            message: 'Customer Code and email are required.',
          });
        }
        result = await authService.loginCustomer(customerCode, email);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid login type.',
        });
    }

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin/login
 * Dedicated Admin Login Route
 */
const adminLoginValidation = [
  body('email').isEmail().withMessage('Valid admin email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest,
];

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/accountant/login
 * Dedicated Accountant Login Route
 */
const accountantLoginValidation = [
  body('email').optional().isEmail().withMessage('Valid email format required.'),
  body('identifier').optional().notEmpty(),
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest,
];

const loginAccountant = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier;
    const { password } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Registered email or Accountant Code is required.',
      });
    }

    const result = await authService.loginAccountant(identifier, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * POST /api/auth/accountant/verify-otp
 */
const verifyOtpValidation = [
  body('userId').notEmpty().withMessage('User ID is required.'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits.')
    .isNumeric()
    .withMessage('OTP must contain only numbers.'),
  validateRequest,
];

const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const result = await authService.verifyOtpAndLogin(userId, otp);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 * POST /api/auth/accountant/resend-otp
 */
const resendOtpValidation = [
  body('userId').notEmpty().withMessage('User ID is required.'),
  validateRequest,
];

const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await authService.resendOtp(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  loginValidation,
  loginAdmin,
  adminLoginValidation,
  loginAccountant,
  accountantLoginValidation,
  verifyOtp,
  verifyOtpValidation,
  resendOtp,
  resendOtpValidation,
  getMe,
};
