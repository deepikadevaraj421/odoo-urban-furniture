const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// Payment Notifications (Admin, Accountant only - for topbar bell)
router.get('/notifications', authorize('ADMIN', 'ACCOUNTANT'), paymentController.getRecentNotifications);

// List Payments (Admin, Accountant, Customer)
router.get('/', authorize('ADMIN', 'ACCOUNTANT', 'CUSTOMER'), paymentController.getPayments);

// Record Payment (Admin, Accountant, Customer)
router.post('/', authorize('ADMIN', 'ACCOUNTANT', 'CUSTOMER'), paymentController.recordPayment);

module.exports = router;
