const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// All customer routes require authentication + CUSTOMER role
router.use(authenticate);
router.use(authorize('CUSTOMER'));

// Profile — ownership enforced via JWT userId
router.get('/profile', customerController.getProfile);

// Orders - strictly isolated to authenticated Customer ID
router.get('/orders', customerController.getOrders);

// Dashboard
router.get('/dashboard', customerController.getDashboard);

// Invoices — strictly isolated to authenticated Customer ID
router.get('/invoices', customerController.getInvoices);

// Payments — strictly isolated to authenticated Customer ID
router.get('/payments', customerController.getPayments);

module.exports = router;
