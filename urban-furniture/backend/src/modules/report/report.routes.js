const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

// Dashboard stats (role-aware: Admin, Accountant, Customer)
router.get('/dashboard-stats', reportController.getDashboardStats);

// Sales & Purchase Accountant Dashboards (date-aware, KPIs, trend, calendar activity)
router.get('/sales-dashboard', authorize('ADMIN', 'ACCOUNTANT'), reportController.getSalesDashboard);
router.get('/purchase-dashboard', authorize('ADMIN', 'ACCOUNTANT'), reportController.getPurchaseDashboard);

// Financial Reports (Admin & Accountant)
router.get('/balance-sheet', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.VIEW_REPORTS), reportController.getBalanceSheet);
router.get('/profit-loss', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.VIEW_REPORTS), reportController.getProfitAndLoss);
router.get('/budget', authorize('ADMIN', 'ACCOUNTANT'), requirePermission(PERMISSIONS.VIEW_REPORTS), reportController.getBudgetReport);

module.exports = router;
