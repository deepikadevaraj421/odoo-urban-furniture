const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Accountants
router.post(
  '/accountants',
  adminController.createAccountantValidation,
  adminController.createAccountant
);

router.get(
  '/accountants',
  adminController.getAccountants
);

// Customers / Users
router.post(
  '/customers',
  adminController.createCustomerValidation,
  adminController.createCustomer
);

router.post(
  '/users',
  adminController.createCustomerValidation,
  adminController.createCustomer
);

module.exports = router;
