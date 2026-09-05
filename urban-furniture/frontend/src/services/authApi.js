import api from './api';

export const authApi = {
  /**
   * Initial Admin One-Time Registration
   */
  registerAdmin: (data) => api.post('/auth/admin/register', data),

  /**
   * Verify Admin Registration OTP
   */
  verifyAdminOtp: (data) => api.post('/auth/admin/verify-otp', data),

  /**
   * Unified / Direct Login (Admin or Accountant password login - NO OTP)
   */
  login: (data) => api.post('/auth/login', data),
  loginAdmin: (data) => api.post('/auth/admin/login', data),
  loginAccountant: (data) => api.post('/auth/accountant/login', data),

  /**
   * Get Accountant Invitation details for setup page
   */
  getInvitationInfo: (id, token) =>
    api.get(`/auth/accountant/invitation-info?id=${id}&token=${token}`),

  /**
   * Accept Invitation & Create Password
   */
  acceptInvitation: (data) => api.post('/auth/accountant/accept-invitation', data),

  /**
   * Resend OTP
   */
  resendOtp: (data) => api.post('/auth/resend-otp', data),

  /**
   * Get current user info (requires JWT)
   */
  getMe: () => api.get('/auth/me'),
};

export const adminApi = {
  /**
   * Create a new accountant (triggers invitation email, NO password)
   */
  createAccountant: (data) => api.post('/admin/accountants', data),

  /**
   * Get list of all accountants
   */
  getAccountants: () => api.get('/admin/accountants'),

  /**
   * Create a new customer
   */
  createCustomer: (data) => api.post('/admin/customers', data),
};

export default authApi;
