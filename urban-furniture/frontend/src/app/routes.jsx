import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROLES, ACCOUNTANT_TYPES, ROUTES } from '../utils/constants';

// Pages
import Login from '../features/auth/pages/Login';
import OTPVerification from '../features/auth/pages/OTPVerification';
import Unauthorized from '../features/auth/pages/Unauthorized';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import AddAccountant from '../features/admin/pages/AddAccountant';
import AddUser from '../features/admin/pages/AddUser';
import SalesAccountantDashboard from '../features/accountant/pages/SalesAccountantDashboard';
import PurchaseAccountantDashboard from '../features/accountant/pages/PurchaseAccountantDashboard';
import CustomerDashboard from '../features/customer/pages/CustomerDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
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
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AddUser />
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

      {/* Customer Protected Route */}
      <Route
        path={ROUTES.CUSTOMER_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};

export default AppRoutes;
