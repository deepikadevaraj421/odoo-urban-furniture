const express = require('express');
const router = express.Router();
const purchaseController = require('./purchase.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);
router.use(authorize('ADMIN', 'ACCOUNTANT'));

// Purchase Orders
router.get('/purchase-orders', purchaseController.getPurchaseOrders);
router.get('/purchase-orders/:id', purchaseController.getPurchaseOrderById);
router.post('/purchase-orders', requirePermission(PERMISSIONS.CREATE_PURCHASE_ORDERS), purchaseController.createPurchaseOrder);
router.put('/purchase-orders/:id/confirm', authorize('ADMIN'), purchaseController.confirmPurchaseOrder);
router.put('/purchase-orders/:id/receive', requirePermission(PERMISSIONS.RECEIVE_GOODS), purchaseController.receiveGoods);
router.post('/purchase-orders/:id/create-bill', requirePermission(PERMISSIONS.CREATE_VENDOR_BILLS), purchaseController.createBillFromPurchaseOrder);

// Vendor Bills
router.get('/vendor-bills', purchaseController.getVendorBills);
router.get('/vendor-bills/:id', purchaseController.getVendorBillById);
router.post('/vendor-bills', requirePermission(PERMISSIONS.CREATE_VENDOR_BILLS), purchaseController.createVendorBill);

module.exports = router;
