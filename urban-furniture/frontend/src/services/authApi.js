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
  loginCustomer: (data) => api.post('/auth/customer/login', data),

  /**
   * Get Invitation details for setup page (works for both Accountant and Customer)
   */
  getInvitationInfo: (id, token) =>
    api.get(`/auth/invitation-info?id=${id}&token=${token}`),

  /**
   * Accept Invitation & Create Password
   */
  acceptInvitation: (data) => api.post('/auth/accept-invitation', data),

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
  getCustomers: (search = '') => api.get(`/admin/customers?search=${encodeURIComponent(search)}`),
};

export const customerApi = {
  getProfile: () => api.get('/customer/profile'),
  getDashboard: () => api.get('/customer/dashboard'),
  getInvoices: () => api.get('/customer/invoices'),
  getPayments: () => api.get('/customer/payments'),

  // Admin / Accountant actions
  createCustomer: (data) => api.post('/admin/customers', data),
  getCustomers: (search = '') => api.get(`/admin/customers?search=${encodeURIComponent(search)}`),
};

export default authApi;
