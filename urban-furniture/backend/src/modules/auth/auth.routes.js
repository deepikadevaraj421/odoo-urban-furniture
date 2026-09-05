const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

// Unified Public Routes
router.post('/login', authController.loginValidation, authController.login);
router.post('/verify-otp', authController.verifyOtpValidation, authController.verifyOtp);
router.post('/resend-otp', authController.resendOtpValidation, authController.resendOtp);

// Dedicated Admin Routes
router.post('/admin/login', authController.adminLoginValidation, authController.loginAdmin);

// Dedicated Accountant Routes
router.post('/accountant/login', authController.accountantLoginValidation, authController.loginAccountant);
router.post('/accountant/verify-otp', authController.verifyOtpValidation, authController.verifyOtp);
router.post('/accountant/resend-otp', authController.resendOtpValidation, authController.resendOtp);

// Protected routes
router.get('/me', authenticate, authController.getMe);

module.exports = router;
