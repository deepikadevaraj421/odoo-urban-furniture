const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

// Sales Orders (Admin & Accountant)
router.get('/sales-orders', authorize('ADMIN', 'ACCOUNTANT'), salesController.getSalesOrders);
router.get('/sales-orders/:id', authorize('ADMIN', 'ACCOUNTANT'), salesController.getSalesOrderById);
router.post('/sales-orders', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.CREATE_SALES_ORDERS), salesController.createSalesOrder);
router.put('/sales-orders/:id/confirm', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.CREATE_SALES_ORDERS), salesController.confirmSalesOrder);
router.post('/sales-orders/:id/create-invoice', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.CREATE_CUSTOMER_INVOICES), salesController.createInvoiceFromSalesOrder);

// Customer Invoices (Accessible to Admin, Accountant, and Customer)
// Customer will only see their own invoices (enforced in controller)
router.get('/customer-invoices', authorize('ADMIN', 'ACCOUNTANT', 'CUSTOMER'), salesController.getCustomerInvoices);
router.get('/customer-invoices/:id', authorize('ADMIN', 'ACCOUNTANT', 'CUSTOMER'), salesController.getCustomerInvoiceById);
router.post('/customer-invoices', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.CREATE_CUSTOMER_INVOICES), salesController.createCustomerInvoice);

module.exports = router;
