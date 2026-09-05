import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROLES, ACCOUNTANT_TYPES, ROUTES } from '../utils/constants';

// Pages
import LandingPage from '../features/landing/LandingPage';
import AdminRegister from '../features/auth/pages/AdminRegister';
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
import CustomerInvoiceDetail from '../features/customer/pages/CustomerInvoiceDetail';
import CustomerPayments from '../features/customer/pages/CustomerPayments';
import CustomerOrders from '../features/customer/pages/CustomerOrders';
import CustomerProfile from '../features/customer/pages/CustomerProfile';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Routes */}
      <Route path="/admin/register" element={<AdminRegister />} />
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
      <Route
        path={ROUTES.CUSTOMER_ORDERS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/invoices/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerInvoiceDetail />
          </ProtectedRoute>
        }
      />

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
