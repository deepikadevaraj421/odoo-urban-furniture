const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);
router.use(authorize('ADMIN', 'ACCOUNTANT'));

// Analytic Accounts
router.get('/analytic-accounts', analyticsController.getAnalyticAccounts);
router.post('/analytic-accounts', analyticsController.createAnalyticAccount);
router.put('/analytic-accounts/:id', analyticsController.updateAnalyticAccount);
router.delete('/analytic-accounts/:id', analyticsController.deleteAnalyticAccount);

// Budgets
router.get('/budgets', analyticsController.getBudgets);
router.post('/budgets', analyticsController.createBudget);

module.exports = router;
