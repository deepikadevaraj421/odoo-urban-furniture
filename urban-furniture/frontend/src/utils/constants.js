// Role constants
export const ROLES = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  CUSTOMER: 'CUSTOMER',
};

// Accountant type constants
export const ACCOUNTANT_TYPES = {
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
};

// Login types
export const LOGIN_TYPES = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  CUSTOMER: 'CUSTOMER',
};

// Route paths
export const ROUTES = {
  LOGIN: '/login',
  OTP_VERIFICATION: '/otp-verification',
  UNAUTHORIZED: '/unauthorized',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ACCOUNTANTS: '/admin/accountants',
  ADD_ACCOUNTANT: '/admin/add-accountant',
  ADD_USER: '/admin/add-user',
  SALES_DASHBOARD: '/accountant/sales/dashboard',
  PURCHASE_DASHBOARD: '/accountant/purchase/dashboard',
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_MANAGEMENT: '/admin/customers',
  CUSTOMER_INVOICES: '/customer/invoices',
  CUSTOMER_PAYMENTS: '/customer/payments',
  CUSTOMER_PROFILE: '/customer/profile',

  // ERP Master Data
  CONTACTS: '/erp/contacts',
  PRODUCTS: '/erp/products',
  CHART_OF_ACCOUNTS: '/erp/chart-of-accounts',
  JOURNALS: '/erp/journals',
  JOURNAL_ENTRIES: '/erp/journal-entries',
  ANALYTIC_ACCOUNTS: '/erp/analytic-accounts',
  BUDGETS: '/erp/budgets',

  // ERP Transactions
  SALES_ORDERS: '/erp/sales-orders',
  CUSTOMER_INVOICES_MGMT: '/erp/customer-invoices',
  PURCHASE_ORDERS: '/erp/purchase-orders',
  VENDOR_BILLS: '/erp/vendor-bills',
  PAYMENTS: '/erp/payments',

  // ERP Reports
  BALANCE_SHEET: '/erp/reports/balance-sheet',
  PROFIT_LOSS: '/erp/reports/profit-loss',
  BUDGET_REPORT: '/erp/reports/budget',
};

// Get redirect path based on role and accountant type
export const getRedirectPath = (role, accountantType) => {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    case ROLES.ACCOUNTANT:
      return accountantType === ACCOUNTANT_TYPES.SALES
        ? ROUTES.SALES_DASHBOARD
        : ROUTES.PURCHASE_DASHBOARD;
    case ROLES.CUSTOMER:
      return ROUTES.CUSTOMER_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};
