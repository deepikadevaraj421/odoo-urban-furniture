/**
 * Centralized Permission Definitions for Urban Furniture ERP
 * 
 * Grouped into: SALES, PURCHASE, ACCOUNTING, MASTER DATA.
 * Used for backend authorization enforcement and validation.
 */

const PERMISSIONS = {
  // SALES
  VIEW_CUSTOMERS: 'VIEW_CUSTOMERS',
  MANAGE_CUSTOMERS: 'MANAGE_CUSTOMERS',
  CREATE_SALES_ORDERS: 'CREATE_SALES_ORDERS',
  CREATE_CUSTOMER_INVOICES: 'CREATE_CUSTOMER_INVOICES',
  VIEW_CUSTOMER_PAYMENTS: 'VIEW_CUSTOMER_PAYMENTS',
  RECORD_CUSTOMER_PAYMENTS: 'RECORD_CUSTOMER_PAYMENTS',

  // PURCHASE
  VIEW_VENDORS: 'VIEW_VENDORS',
  MANAGE_VENDORS: 'MANAGE_VENDORS',
  CREATE_PURCHASE_ORDERS: 'CREATE_PURCHASE_ORDERS',
  RECEIVE_GOODS: 'RECEIVE_GOODS',
  CREATE_VENDOR_BILLS: 'CREATE_VENDOR_BILLS',
  VIEW_VENDOR_PAYMENTS: 'VIEW_VENDOR_PAYMENTS',
  RECORD_VENDOR_PAYMENTS: 'RECORD_VENDOR_PAYMENTS',

  // ACCOUNTING
  VIEW_CHART_OF_ACCOUNTS: 'VIEW_CHART_OF_ACCOUNTS',
  VIEW_JOURNALS: 'VIEW_JOURNALS',
  VIEW_JOURNAL_ENTRIES: 'VIEW_JOURNAL_ENTRIES',
  CREATE_JOURNAL_ENTRIES: 'CREATE_JOURNAL_ENTRIES',
  VIEW_REPORTS: 'VIEW_REPORTS',

  // MASTER DATA
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  EDIT_PRODUCTS: 'EDIT_PRODUCTS',
  VIEW_CONTACTS: 'VIEW_CONTACTS',
  EDIT_CONTACTS: 'EDIT_CONTACTS',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const PERMISSION_GROUPS = [
  {
    key: 'SALES',
    title: 'SALES',
    description: 'Customer relations, sales order creation, customer billing, and receivables.',
    permissions: [
      { key: PERMISSIONS.VIEW_CUSTOMERS, label: 'View Customers', actionDesc: 'view customers' },
      { key: PERMISSIONS.MANAGE_CUSTOMERS, label: 'Manage Customers', actionDesc: 'manage customers' },
      { key: PERMISSIONS.CREATE_SALES_ORDERS, label: 'Create Sales Orders', actionDesc: 'create sales orders' },
      { key: PERMISSIONS.CREATE_CUSTOMER_INVOICES, label: 'Create Customer Invoices', actionDesc: 'create customer invoices' },
      { key: PERMISSIONS.VIEW_CUSTOMER_PAYMENTS, label: 'View Customer Payments', actionDesc: 'view customer payments' },
      { key: PERMISSIONS.RECORD_CUSTOMER_PAYMENTS, label: 'Record Customer Payments', actionDesc: 'record customer payments' },
    ],
  },
  {
    key: 'PURCHASE',
    title: 'PURCHASE',
    description: 'Vendor management, purchase orders, goods receipts, supplier bills, and payables.',
    permissions: [
      { key: PERMISSIONS.VIEW_VENDORS, label: 'View Vendors', actionDesc: 'view vendors' },
      { key: PERMISSIONS.MANAGE_VENDORS, label: 'Manage Vendors', actionDesc: 'manage vendors' },
      { key: PERMISSIONS.CREATE_PURCHASE_ORDERS, label: 'Create Purchase Orders', actionDesc: 'create purchase orders' },
      { key: PERMISSIONS.RECEIVE_GOODS, label: 'Receive Goods', actionDesc: 'receive goods' },
      { key: PERMISSIONS.CREATE_VENDOR_BILLS, label: 'Create Vendor Bills', actionDesc: 'create vendor bills' },
      { key: PERMISSIONS.VIEW_VENDOR_PAYMENTS, label: 'View Vendor Payments', actionDesc: 'view vendor payments' },
      { key: PERMISSIONS.RECORD_VENDOR_PAYMENTS, label: 'Record Vendor Payments', actionDesc: 'record vendor payments' },
    ],
  },
  {
    key: 'ACCOUNTING',
    title: 'ACCOUNTING',
    description: 'General ledger, charts of accounts, journals, journal entries, and financial statements.',
    permissions: [
      { key: PERMISSIONS.VIEW_CHART_OF_ACCOUNTS, label: 'View Chart of Accounts', actionDesc: 'view chart of accounts' },
      { key: PERMISSIONS.VIEW_JOURNALS, label: 'View Journals', actionDesc: 'view journals' },
      { key: PERMISSIONS.VIEW_JOURNAL_ENTRIES, label: 'View Journal Entries', actionDesc: 'view journal entries' },
      { key: PERMISSIONS.CREATE_JOURNAL_ENTRIES, label: 'Create Journal Entries', actionDesc: 'create journal entries' },
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports', actionDesc: 'view financial reports' },
    ],
  },
  {
    key: 'MASTER_DATA',
    title: 'MASTER DATA',
    description: 'Shared furniture catalog and contact directory records.',
    permissions: [
      { key: PERMISSIONS.VIEW_PRODUCTS, label: 'View Products', actionDesc: 'view products' },
      { key: PERMISSIONS.EDIT_PRODUCTS, label: 'Edit Products', actionDesc: 'edit products' },
      { key: PERMISSIONS.VIEW_CONTACTS, label: 'View Contacts', actionDesc: 'view contacts' },
      { key: PERMISSIONS.EDIT_CONTACTS, label: 'Edit Contacts', actionDesc: 'edit contacts' },
    ],
  },
];

/**
 * Get default permissions based on accountant type
 */
const getDefaultPermissions = (accountantType) => {
  if (accountantType === 'SALES') {
    return [
      PERMISSIONS.VIEW_CUSTOMERS,
      PERMISSIONS.MANAGE_CUSTOMERS,
      PERMISSIONS.CREATE_SALES_ORDERS,
      PERMISSIONS.CREATE_CUSTOMER_INVOICES,
      PERMISSIONS.VIEW_CUSTOMER_PAYMENTS,
      PERMISSIONS.RECORD_CUSTOMER_PAYMENTS,
      PERMISSIONS.VIEW_PRODUCTS,
      PERMISSIONS.VIEW_CONTACTS,
      PERMISSIONS.VIEW_CHART_OF_ACCOUNTS,
      PERMISSIONS.VIEW_JOURNALS,
      PERMISSIONS.VIEW_JOURNAL_ENTRIES,
      PERMISSIONS.VIEW_REPORTS,
    ];
  }

  if (accountantType === 'PURCHASE') {
    return [
      PERMISSIONS.VIEW_VENDORS,
      PERMISSIONS.MANAGE_VENDORS,
      PERMISSIONS.CREATE_PURCHASE_ORDERS,
      PERMISSIONS.RECEIVE_GOODS,
      PERMISSIONS.CREATE_VENDOR_BILLS,
      PERMISSIONS.VIEW_VENDOR_PAYMENTS,
      PERMISSIONS.RECORD_VENDOR_PAYMENTS,
      PERMISSIONS.VIEW_PRODUCTS,
      PERMISSIONS.VIEW_CONTACTS,
      PERMISSIONS.VIEW_CHART_OF_ACCOUNTS,
      PERMISSIONS.VIEW_JOURNALS,
      PERMISSIONS.VIEW_JOURNAL_ENTRIES,
      PERMISSIONS.VIEW_REPORTS,
    ];
  }

  return [];
};

/**
 * Map permission key to human-readable action description
 */
const PERMISSION_DESCRIPTIONS = {};
PERMISSION_GROUPS.forEach((group) => {
  group.permissions.forEach((p) => {
    PERMISSION_DESCRIPTIONS[p.key] = p.actionDesc;
  });
});

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  getDefaultPermissions,
  PERMISSION_DESCRIPTIONS,
};
