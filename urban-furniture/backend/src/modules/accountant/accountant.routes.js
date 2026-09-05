const express = require('express');
const router = express.Router();
const accountantController = require('./accountant.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, authorizeAccountantType } = require('../../middleware/authorize');

// All accountant routes require authentication + ACCOUNTANT role
router.use(authenticate);
router.use(authorize('ACCOUNTANT'));

// Profile — accessible by any accountant
router.get('/profile', accountantController.getProfile);

// Sales dashboard — SALES accountants only
router.get(
  '/sales/dashboard',
  authorizeAccountantType('SALES'),
  accountantController.getSalesDashboard
);

// Purchase dashboard — PURCHASE accountants only
router.get(
  '/purchase/dashboard',
  authorizeAccountantType('PURCHASE'),
  accountantController.getPurchaseDashboard
);

// Customer management — accessible by accountants
const customerController = require('../customer/customer.controller');
router.post('/customers', customerController.createCustomerValidation, customerController.createCustomer);
router.get('/customers', customerController.getCustomers);
router.post('/customers/:id/resend-invitation', customerController.resendInvitation);

module.exports = router;
