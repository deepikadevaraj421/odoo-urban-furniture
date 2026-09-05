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

// Dashboard placeholder
router.get('/dashboard', customerController.getDashboard);

module.exports = router;
