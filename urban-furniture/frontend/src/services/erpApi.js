import api from './api';

export const erpApi = {
  // Contacts
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),

  // Products
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Chart of Accounts
  getAccounts: (params) => api.get('/accounts', { params }),
  getAccount: (id) => api.get(`/accounts/${id}`),
  createAccount: (data) => api.post('/accounts', data),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  importAccounts: (data) => api.post('/accounts/import', data),

  // Journals & Journal Entries
  getJournals: () => api.get('/journals'),
  createJournal: (data) => api.post('/journals', data),
  getJournalEntries: (params) => api.get('/journal-entries', { params }),
  getJournalEntry: (id) => api.get(`/journal-entries/${id}`),
  createJournalEntry: (data) => api.post('/journal-entries', data),
  updateJournalEntry: (id, data) => api.put(`/journal-entries/${id}`, data),
  postJournalEntry: (id) => api.post(`/journal-entries/${id}/post`),
  deleteJournalEntry: (id) => api.delete(`/journal-entries/${id}`),

  // Sales Orders
  getSalesOrders: (params) => api.get('/sales-orders', { params }),
  getSalesOrder: (id) => api.get(`/sales-orders/${id}`),
  createSalesOrder: (data) => api.post('/sales-orders', data),
  confirmSalesOrder: (id) => api.put(`/sales-orders/${id}/confirm`),
  createInvoiceFromOrder: (id) => api.post(`/sales-orders/${id}/create-invoice`),

  // Customer Invoices
  getCustomerInvoices: (params) => api.get('/customer-invoices', { params }),
  getCustomerInvoice: (id) => api.get(`/customer-invoices/${id}`),
  createCustomerInvoice: (data) => api.post('/customer-invoices', data),

  // Purchase Orders
  getPurchaseOrders: (params) => api.get('/purchase-orders', { params }),
  getPurchaseOrder: (id) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => api.post('/purchase-orders', data),
  confirmPurchaseOrder: (id) => api.put(`/purchase-orders/${id}/confirm`),
  receiveGoods: (id) => api.put(`/purchase-orders/${id}/receive`),
  createBillFromOrder: (id) => api.post(`/purchase-orders/${id}/create-bill`),

  // Vendor Bills
  getVendorBills: (params) => api.get('/vendor-bills', { params }),
  getVendorBill: (id) => api.get(`/vendor-bills/${id}`),
  createVendorBill: (data) => api.post('/vendor-bills', data),

  // Payments
  getPayments: (params) => api.get('/payments', { params }),
  recordPayment: (data) => api.post('/payments', data),
  getNotifications: () => api.get('/payments/notifications'),

  // Analytics & Budgets
  getAnalyticAccounts: (params) => api.get('/analytic-accounts', { params }),
  createAnalyticAccount: (data) => api.post('/analytic-accounts', data),
  updateAnalyticAccount: (id, data) => api.put(`/analytic-accounts/${id}`, data),
  deleteAnalyticAccount: (id) => api.delete(`/analytic-accounts/${id}`),
  getBudgets: (params) => api.get('/budgets', { params }),
  createBudget: (data) => api.post('/budgets', data),

  // Reports & Dashboard Stats
  getBalanceSheet: (params) => api.get('/reports/balance-sheet', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getBudgetReport: (params) => api.get('/reports/budget', { params }),
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getSalesDashboard: (params) => api.get('/reports/sales-dashboard', { params }),
  getPurchaseDashboard: (params) => api.get('/reports/purchase-dashboard', { params }),
};

export default erpApi;
