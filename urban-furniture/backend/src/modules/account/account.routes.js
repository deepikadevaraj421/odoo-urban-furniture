const express = require('express');
const router = express.Router();
const accountController = require('./account.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);
router.use(authorize('ADMIN', 'ACCOUNTANT'));

router.get('/', requirePermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS), accountController.getAccounts);
router.post('/', accountController.createAccount);
router.post('/import', accountController.importAccounts);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS), accountController.getAccountById);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
