const { body, query } = require('express-validator');
const customerService = require('./customer.service');
const validateRequest = require('../../middleware/validateRequest');

/**
 * Validation rules for creating a customer
 */
const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail({ gmail_remove_subaddress: false }).withMessage('Valid email address is required.'),
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
    if (req.user?.role === 'ACCOUNTANT') {
      const perms = req.user.permissions || [];
      if (!perms.includes('MANAGE_CUSTOMERS') && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage customers.',
        });
      }
    }

    const origin = req.get('origin') || req.headers?.origin;
    const result = await customerService.createCustomer(req.body, req.user?.userId, origin);

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
    if (req.user?.role === 'ACCOUNTANT') {
      const perms = req.user.permissions || [];
      if (!perms.includes('VIEW_CUSTOMERS') && !perms.includes('VIEW_CONTACTS')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view customers.',
        });
      }
    }

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
 * GET /api/customer/orders
 * Customer Orders - ownership derived from the authenticated user.
 */
const getOrders = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerOrders(req.user.userId);
    if (!result.success) return res.status(404).json(result);
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
    const ordersRes = await customerService.getCustomerOrders(req.user.userId);
    const invoicesRes = await customerService.getCustomerInvoices(req.user.userId);
    const paymentsRes = await customerService.getCustomerPayments(req.user.userId);

    if (!profileRes.success) {
      return res.status(404).json(profileRes);
    }

    const invoices = invoicesRes.invoices || [];
    const payments = paymentsRes.payments || [];
    const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const paidAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0);

    return res.status(200).json({
      success: true,
      message: 'Customer Dashboard Summary',
      customer: profileRes.customer,
      ordersCount: ordersRes.orders?.length || 0,
      invoicesCount: invoices.length,
      paymentsCount: payments.length,
      kpi: {
        totalOrders: ordersRes.orders?.length || 0,
        totalInvoices: invoices.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount: Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100),
      },
      recentInvoices: invoices,
      recentOrders: ordersRes.orders || [],
      recentPayments: payments,
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
    const origin = req.get('origin') || req.headers?.origin;
    const result = await customerService.resendCustomerInvitation(id, origin);

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
  getOrders,
  getInvoices,
  getPayments,
  getDashboard,
};
