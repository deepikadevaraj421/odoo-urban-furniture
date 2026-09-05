const { body, query } = require('express-validator');
const authService = require('./auth.service');
const invitationService = require('./invitation.service');
const validateRequest = require('../../middleware/validateRequest');

/**
 * POST /api/auth/admin/register
 * Initial One-Time Admin Registration
 */
const adminRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
  validateRequest,
];

const registerAdmin = async (req, res, next) => {
  try {
    const result = await authService.registerAdmin(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin/verify-otp
 * Verify Admin Registration OTP
 */
const verifyAdminOtpValidation = [
  body('userId').notEmpty().withMessage('User ID is required.'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits.')
    .isNumeric()
    .withMessage('OTP must contain only numbers.'),
  validateRequest,
];

const verifyAdminOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const result = await authService.verifyAdminRegistrationOtp(userId, otp);

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
 * Admin Normal Login (NO OTP)
 */
const adminLoginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid admin email is required.'),
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
 * Accountant Normal Login (NO OTP)
 */
const accountantLoginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid registered email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest,
];

const loginAccountant = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAccountant(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/accountant/invitation-info
 * Fetch accountant info for Accept Invitation UI
 */
const getInvitationInfo = async (req, res, next) => {
  try {
    const { id, token } = req.query;

    if (!id || !token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation ID and token are required.',
      });
    }

    const result = await invitationService.getInvitationDetails(id, token);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      invitation: result.invitation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/accountant/accept-invitation or set-password
 * Set password and activate Accountant account
 */
const acceptInvitationValidation = [
  body('invitationId').notEmpty().withMessage('Invitation ID is required.'),
  body('token').notEmpty().withMessage('Invitation token is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
  validateRequest,
];

const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId, token, newPassword } = req.body;
    const result = await invitationService.acceptInvitationAndSetPassword(
      invitationId,
      token,
      newPassword
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/customer/login
 * Customer Normal Login (NO OTP)
 */
const customerLoginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid registered email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest,
];

const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginCustomer(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Unified Login Endpoint
 */
const login = async (req, res, next) => {
  try {
    const { loginType, email, password } = req.body;

    if (loginType === 'ADMIN') {
      return loginAdmin(req, res, next);
    } else if (loginType === 'ACCOUNTANT') {
      return loginAccountant(req, res, next);
    } else if (loginType === 'CUSTOMER') {
      return loginCustomer(req, res, next);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid login type specified.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 */
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
  registerAdmin,
  adminRegisterValidation,
  verifyAdminOtp,
  verifyAdminOtpValidation,
  loginAdmin,
  adminLoginValidation,
  loginAccountant,
  accountantLoginValidation,
  loginCustomer,
  customerLoginValidation,
  getInvitationInfo,
  acceptInvitation,
  acceptInvitationValidation,
  login,
  resendOtp,
  getMe,
};
