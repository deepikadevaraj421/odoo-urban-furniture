const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

// Public Admin Registration & OTP Routes
router.post('/admin/register', authController.adminRegisterValidation, authController.registerAdmin);
router.post('/admin/verify-otp', authController.verifyAdminOtpValidation, authController.verifyAdminOtp);

// Public Login Routes (NO OTP for normal login)
router.post('/admin/login', authController.adminLoginValidation, authController.loginAdmin);
router.post('/accountant/login', authController.accountantLoginValidation, authController.loginAccountant);
router.post('/customer/login', authController.customerLoginValidation, authController.loginCustomer);
router.post('/login', authController.login);

// Public Invitation Routes
router.get('/accountant/invitation-info', authController.getInvitationInfo);
router.get('/customer/invitation-info', authController.getInvitationInfo);
router.get('/invitation-info', authController.getInvitationInfo);
router.post('/accountant/accept-invitation', authController.acceptInvitationValidation, authController.acceptInvitation);
router.post('/customer/accept-invitation', authController.acceptInvitationValidation, authController.acceptInvitation);
router.post('/accept-invitation', authController.acceptInvitationValidation, authController.acceptInvitation);
router.post('/accountant/set-password', authController.acceptInvitationValidation, authController.acceptInvitation);

// OTP Resend
router.post('/resend-otp', authController.resendOtp);

// Protected routes
router.get('/me', authenticate, authController.getMe);

module.exports = router;
