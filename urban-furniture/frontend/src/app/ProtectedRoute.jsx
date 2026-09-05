import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

const ProtectedRoute = ({ children, allowedRoles, allowedAccountantTypes }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#58a6ff'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Loading Urban Furniture ERP...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  if (
    allowedAccountantTypes &&
    user.role === 'ACCOUNTANT' &&
    !allowedAccountantTypes.includes(user.accountantType)
  ) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
};

export default ProtectedRoute;
