import api from './api';

export const customerApi = {
  /** GET /api/customer/dashboard */
  getDashboard: () => api.get('/customer/dashboard'),

  /** GET /api/customer/profile */
  getProfile: () => api.get('/customer/profile'),

  /** PATCH /api/customer/profile */
  updateProfile: (data) => api.patch('/customer/profile', data),

  /** GET /api/customer/invoices */
  getInvoices: (params = {}) => api.get('/customer/invoices', { params }),

  /** GET /api/customer/invoices/:id */
  getInvoiceById: (id) => api.get(`/customer/invoices/${id}`),

  /** POST /api/customer/invoices/:id/pay */
  payInvoice: (id, data) => api.post(`/customer/invoices/${id}/pay`, data),

  /** POST /api/customer/invoices/:id/emi */
  createEmi: (id, data) => api.post(`/customer/invoices/${id}/emi`, data),

  /** GET /api/customer/payments */
  getPayments: (params = {}) => api.get('/customer/payments', { params }),

  /** GET /api/customer/orders */
  getOrders: () => api.get('/customer/orders'),
};

export default customerApi;
