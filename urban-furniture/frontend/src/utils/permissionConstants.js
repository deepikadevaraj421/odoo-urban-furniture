/**
 * Centralized Permission Constants & UI Metadata for Urban Furniture ERP
 */

export const PERMISSIONS = {
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

export const PERMISSION_GROUPS = [
  {
    key: 'SALES',
    title: 'SALES',
    badge: 'Sales & AR',
    icon: '🛍️',
    description: 'Control access to customer records, sales ordering, invoicing, and customer payment receipts.',
    permissions: [
      { key: PERMISSIONS.VIEW_CUSTOMERS, label: 'View Customers', detail: 'Read-only access to customer listings and contact cards' },
      { key: PERMISSIONS.MANAGE_CUSTOMERS, label: 'Manage Customers', detail: 'Create, update, and modify customer directory profiles' },
      { key: PERMISSIONS.CREATE_SALES_ORDERS, label: 'Create Sales Orders', detail: 'Generate and confirm customer sales quotations & orders' },
      { key: PERMISSIONS.CREATE_CUSTOMER_INVOICES, label: 'Create Customer Invoices', detail: 'Issue customer tax invoices from orders or directly' },
      { key: PERMISSIONS.VIEW_CUSTOMER_PAYMENTS, label: 'View Customer Payments', detail: 'Browse customer receipts, balances, and payment activity' },
      { key: PERMISSIONS.RECORD_CUSTOMER_PAYMENTS, label: 'Record Customer Payments', detail: 'Post customer payment receipts against invoices' },
    ],
  },
  {
    key: 'PURCHASE',
    title: 'PURCHASE',
    badge: 'Procurement & AP',
    icon: '📦',
    description: 'Control access to vendor accounts, purchase orders, goods receipts, and vendor bills.',
    permissions: [
      { key: PERMISSIONS.VIEW_VENDORS, label: 'View Vendors', detail: 'Read-only access to vendor catalog and supplier directory' },
      { key: PERMISSIONS.MANAGE_VENDORS, label: 'Manage Vendors', detail: 'Register and edit supplier contact profiles' },
      { key: PERMISSIONS.CREATE_PURCHASE_ORDERS, label: 'Create Purchase Orders', detail: 'Issue purchase orders to raw material and furniture suppliers' },
      { key: PERMISSIONS.RECEIVE_GOODS, label: 'Receive Goods', detail: 'Process warehouse goods arrival and inventory intake' },
      { key: PERMISSIONS.CREATE_VENDOR_BILLS, label: 'Create Vendor Bills', detail: 'Register supplier bills against purchase orders' },
      { key: PERMISSIONS.VIEW_VENDOR_PAYMENTS, label: 'View Vendor Payments', detail: 'Browse supplier disbursements and payment activity' },
      { key: PERMISSIONS.RECORD_VENDOR_PAYMENTS, label: 'Record Vendor Payments', detail: 'Disburse supplier payments and record outbound transactions' },
    ],
  },
  {
    key: 'ACCOUNTING',
    title: 'ACCOUNTING',
    badge: 'Ledger & Financials',
    icon: '📑',
    description: 'Access chart of accounts, journal registers, journal entries, and financial statements.',
    permissions: [
      { key: PERMISSIONS.VIEW_CHART_OF_ACCOUNTS, label: 'View Chart of Accounts', detail: 'Browse structured asset, liability, and equity accounts' },
      { key: PERMISSIONS.VIEW_JOURNALS, label: 'View Journals', detail: 'Inspect bank, cash, sales, and purchase journal books' },
      { key: PERMISSIONS.VIEW_JOURNAL_ENTRIES, label: 'View Journal Entries', detail: 'Audit double-entry balanced debit/credit journal slips' },
      { key: PERMISSIONS.CREATE_JOURNAL_ENTRIES, label: 'Create Journal Entries', detail: 'Draft and post manual debit/credit journal transactions' },
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports', detail: 'Generate Balance Sheet, Profit & Loss, and Budget analysis' },
    ],
  },
  {
    key: 'MASTER_DATA',
    title: 'MASTER DATA',
    badge: 'Core Entities',
    icon: '🛋️',
    description: 'Global furniture items and master directory maintenance.',
    permissions: [
      { key: PERMISSIONS.VIEW_PRODUCTS, label: 'View Products', detail: 'Browse furniture catalog items, pricing, and stock' },
      { key: PERMISSIONS.EDIT_PRODUCTS, label: 'Edit Products', detail: 'Add new furniture products, alter prices, and edit specs' },
      { key: PERMISSIONS.VIEW_CONTACTS, label: 'View Contacts', detail: 'Access comprehensive master address and contact book' },
      { key: PERMISSIONS.EDIT_CONTACTS, label: 'Edit Contacts', detail: 'Create and update master contact records' },
    ],
  },
];
