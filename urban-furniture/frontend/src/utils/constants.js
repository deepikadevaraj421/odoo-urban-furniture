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
  ADD_ACCOUNTANT: '/admin/add-accountant',
  ADD_USER: '/admin/add-user',
  SALES_DASHBOARD: '/accountant/sales/dashboard',
  PURCHASE_DASHBOARD: '/accountant/purchase/dashboard',
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_MANAGEMENT: '/admin/customers',
  CUSTOMER_INVOICES: '/customer/invoices',
  CUSTOMER_PAYMENTS: '/customer/payments',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_PROFILE: '/customer/profile',
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
