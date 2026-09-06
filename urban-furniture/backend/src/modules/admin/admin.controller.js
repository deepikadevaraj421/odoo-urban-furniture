const { body } = require('express-validator');
const adminService = require('./admin.service');
const validateRequest = require('../../middleware/validateRequest');

/**
 * POST /api/admin/accountants
 * Create a new accountant (Admin only)
 */
const createAccountantValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required.'),
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('accountantType')
    .isIn(['SALES', 'PURCHASE'])
    .withMessage('Accountant type must be SALES or PURCHASE.'),
  validateRequest,
];

const createAccountant = async (req, res, next) => {
  try {
    const result = await adminService.createAccountant(req.body, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/accountants
 * List all accountants (Admin only)
 */
const getAccountants = async (req, res, next) => {
  try {
    const result = await adminService.getAccountants();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/customers or /api/admin/users
 * Create a new customer / user (Admin only)
 */
const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail({ gmail_remove_subaddress: false }).withMessage('Valid email is required.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('address').optional().trim(),
  validateRequest,
];

const createCustomer = async (req, res, next) => {
  try {
    const origin = req.get('origin') || req.headers?.origin;
    const result = await adminService.createCustomer(req.body, req.user.userId, origin);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/accountants/:id/permissions
 * Update permissions for an accountant (Admin only)
 */
const updatePermissionsValidation = [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array of permission strings.'),
  validateRequest,
];

const updatePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const result = await adminService.updateAccountantPermissions(id, permissions);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccountant,
  createAccountantValidation,
  getAccountants,
  updatePermissions,
  updatePermissionsValidation,
  createCustomer,
  createCustomerValidation,
};
