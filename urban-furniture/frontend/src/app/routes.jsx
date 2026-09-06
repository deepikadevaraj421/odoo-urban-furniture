import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROLES, ACCOUNTANT_TYPES, ROUTES } from '../utils/constants';

// Pages
import LandingPage from '../features/landing/LandingPage';
import AcceptInvitation from '../features/auth/pages/AcceptInvitation';
import Login from '../features/auth/pages/Login';
import OTPVerification from '../features/auth/pages/OTPVerification';
import Unauthorized from '../features/auth/pages/Unauthorized';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import AddAccountant from '../features/admin/pages/AddAccountant';
import AddUser from '../features/admin/pages/AddUser';
import SalesAccountantDashboard from '../features/accountant/pages/SalesAccountantDashboard';
import PurchaseAccountantDashboard from '../features/accountant/pages/PurchaseAccountantDashboard';
import CustomerManagement from '../features/admin/pages/CustomerManagement';
import CustomerDashboard from '../features/customer/pages/CustomerDashboard';
import CustomerInvoices from '../features/customer/pages/CustomerInvoices';
import CustomerPayments from '../features/customer/pages/CustomerPayments';
import CustomerProfile from '../features/customer/pages/CustomerProfile';

// ERP Master Data Pages
import ContactsPage from '../features/erp/pages/ContactsPage';
import ProductsPage from '../features/erp/pages/ProductsPage';
import ChartOfAccountsPage from '../features/erp/pages/ChartOfAccountsPage';
import JournalsPage from '../features/erp/pages/JournalsPage';
import JournalEntriesPage from '../features/erp/pages/JournalEntriesPage';
import AnalyticAccountsPage from '../features/erp/pages/AnalyticAccountsPage';
import BudgetsPage from '../features/erp/pages/BudgetsPage';

// ERP Transaction Pages
import SalesOrdersPage from '../features/erp/pages/SalesOrdersPage';
import CustomerInvoicesPage from '../features/erp/pages/CustomerInvoicesPage';
import PurchaseOrdersPage from '../features/erp/pages/PurchaseOrdersPage';
import VendorBillsPage from '../features/erp/pages/VendorBillsPage';
import PaymentsRoute from '../features/erp/pages/PaymentsRoute';

// ERP Report Pages
import BalanceSheetPage from '../features/erp/pages/BalanceSheetPage';
import ProfitLossPage from '../features/erp/pages/ProfitLossPage';
import BudgetReportPage from '../features/erp/pages/BudgetReportPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Routes */}
      <Route path="/admin/register" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.OTP_VERIFICATION} element={<OTPVerification />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

      {/* Admin Protected Routes */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accountants"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AddAccountant />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADD_ACCOUNTANT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AddAccountant />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADD_USER}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <AddUser />
          </ProtectedRoute>
        }
      />

      {/* Shared Customer Management (Admin & Accountant) */}
      <Route
        path={ROUTES.CUSTOMER_MANAGEMENT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <CustomerManagement />
          </ProtectedRoute>
        }
      />

      {/* Sales Accountant Protected Route */}
      <Route
        path={ROUTES.SALES_DASHBOARD}
        element={
          <ProtectedRoute
            allowedRoles={[ROLES.ACCOUNTANT]}
            allowedAccountantTypes={[ACCOUNTANT_TYPES.SALES]}
          >
            <SalesAccountantDashboard />
          </ProtectedRoute>
        }
      />

      {/* Purchase Accountant Protected Route */}
      <Route
        path={ROUTES.PURCHASE_DASHBOARD}
        element={
          <ProtectedRoute
            allowedRoles={[ROLES.ACCOUNTANT]}
            allowedAccountantTypes={[ACCOUNTANT_TYPES.PURCHASE]}
          >
            <PurchaseAccountantDashboard />
          </ProtectedRoute>
        }
      />

      {/* Customer Protected Routes */}
      <Route
        path={ROUTES.CUSTOMER_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER_INVOICES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER_PAYMENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER_PROFILE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />

      {/* ═══════════════════════════════════════════════
          ERP MASTER DATA ROUTES (Admin & Accountant)
          ═══════════════════════════════════════════════ */}
      <Route
        path={ROUTES.CONTACTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PRODUCTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CHART_OF_ACCOUNTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <ChartOfAccountsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.JOURNALS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <JournalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.JOURNAL_ENTRIES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <JournalEntriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ANALYTIC_ACCOUNTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <AnalyticAccountsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.BUDGETS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <BudgetsPage />
          </ProtectedRoute>
        }
      />

      {/* ═══════════════════════════════════════════════
          ERP TRANSACTION ROUTES (Admin & Accountant)
          ═══════════════════════════════════════════════ */}
      <Route
        path={ROUTES.SALES_ORDERS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <SalesOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER_INVOICES_MGMT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <CustomerInvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PURCHASE_ORDERS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <PurchaseOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.VENDOR_BILLS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <VendorBillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PAYMENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <PaymentsRoute />
          </ProtectedRoute>
        }
      />

      {/* ═══════════════════════════════════════════════
          ERP REPORT ROUTES (Admin & Accountant)
          ═══════════════════════════════════════════════ */}
      <Route
        path={ROUTES.BALANCE_SHEET}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <BalanceSheetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFIT_LOSS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <ProfitLossPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.BUDGET_REPORT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <BudgetReportPage />
          </ProtectedRoute>
        }
      />

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
