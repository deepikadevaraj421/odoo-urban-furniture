import api from './api';

export const authApi = {
  /**
   * Login — unified endpoint for all roles
   * @param {Object} data - { loginType, email?, password?, identifier?, customerCode? }
   */
  login: (data) => api.post('/auth/login', data),

  /**
   * Verify OTP
   * @param {Object} data - { userId, otp }
   */
  verifyOtp: (data) => api.post('/auth/verify-otp', data),

  /**
   * Resend OTP
   * @param {Object} data - { userId }
   */
  resendOtp: (data) => api.post('/auth/resend-otp', data),

  /**
   * Get current user info (requires JWT)
   */
  getMe: () => api.get('/auth/me'),
};

export const adminApi = {
  /**
   * Create a new accountant
   */
  createAccountant: (data) => api.post('/admin/accountants', data),

  /**
   * Create a new customer
   */
  createCustomer: (data) => api.post('/admin/customers', data),
};

export default authApi;
