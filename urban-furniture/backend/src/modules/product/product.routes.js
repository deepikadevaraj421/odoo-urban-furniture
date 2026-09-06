const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);
// Accessible to Admin and Accountants
router.use(authorize('ADMIN', 'ACCOUNTANT'));

router.get('/', requirePermission(PERMISSIONS.VIEW_PRODUCTS), productController.getProducts);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_PRODUCTS), productController.getProductById);
router.post('/', requirePermission(PERMISSIONS.EDIT_PRODUCTS), productController.createProduct);
router.put('/:id', requirePermission(PERMISSIONS.EDIT_PRODUCTS), productController.updateProduct);
router.delete('/:id', requirePermission(PERMISSIONS.EDIT_PRODUCTS), productController.deleteProduct);

module.exports = router;
