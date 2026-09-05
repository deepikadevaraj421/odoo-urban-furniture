import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const Header = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'ADMIN') return <span className="badge badge-admin">Admin</span>;
    if (user.role === 'ACCOUNTANT') {
      return (
        <span className={`badge ${user.accountantType === 'SALES' ? 'badge-sales' : 'badge-purchase'}`}>
          {user.accountantType} Accountant
        </span>
      );
    }
    if (user.role === 'CUSTOMER') return <span className="badge badge-customer">Customer</span>;
    return null;
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">UF</div>
        <div className="brand-text">
          <h1>{title || 'Urban Furniture'}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {user && (
        <div className="header-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            {getRoleBadge()}
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
