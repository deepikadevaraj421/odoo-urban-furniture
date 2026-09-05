import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getRedirectPath } from '../../../utils/constants';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      const path = getRedirectPath(user.role, user.accountantType);
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card text-center">
        <div className="unauthorized-icon">🚫</div>
        <h2 className="auth-title">403 - Access Denied</h2>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          You do not have permission to access this page or resource.
        </p>
        <button onClick={handleGoHome} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
