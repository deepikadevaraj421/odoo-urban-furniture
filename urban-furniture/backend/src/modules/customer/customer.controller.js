const { body, query } = require('express-validator');
const customerService = require('./customer.service');
const validateRequest = require('../../middleware/validateRequest');

/**
 * Validation rules for creating a customer
 */
const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email address is required.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('address').optional().trim(),
  validateRequest,
];

/**
 * POST /api/admin/customers or /api/accountant/customers
 * Create new Customer
 */
const createCustomer = async (req, res, next) => {
  try {
    const result = await customerService.createCustomer(req.body, req.user?.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/customers or /api/accountant/customers
 * Get list of all customers or search by query (Customer ID, Name, Email, Mobile)
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const result = await customerService.getCustomers(search);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/profile
 * Customer Profile — Ownership derived strictly from JWT userId
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerProfile(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/invoices
 * Customer Invoices — Ownership derived strictly from JWT userId
 */
const getInvoices = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerInvoices(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/payments
 * Customer Payments — Ownership derived strictly from JWT userId
 */
const getPayments = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerPayments(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/dashboard
 * Customer Dashboard summary
 */
const getDashboard = async (req, res, next) => {
  try {
    const profileRes = await customerService.getCustomerProfile(req.user.userId);
    const invoicesRes = await customerService.getCustomerInvoices(req.user.userId);
    const paymentsRes = await customerService.getCustomerPayments(req.user.userId);

    if (!profileRes.success) {
      return res.status(404).json(profileRes);
    }

    return res.status(200).json({
      success: true,
      message: 'Customer Dashboard Summary',
      customer: profileRes.customer,
      invoicesCount: invoicesRes.invoices?.length || 0,
      paymentsCount: paymentsRes.payments?.length || 0,
      recentInvoices: invoicesRes.invoices || [],
      recentPayments: paymentsRes.payments || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/customers/:id/resend-invitation or /api/accountant/customers/:id/resend-invitation
 * Resend Customer Invitation Email
 */
const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await customerService.resendCustomerInvitation(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomerValidation,
  createCustomer,
  resendInvitation,
  getCustomers,
  getProfile,
  getInvoices,
  getPayments,
  getDashboard,
};
