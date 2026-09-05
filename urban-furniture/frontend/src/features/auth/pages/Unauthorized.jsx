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
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>🛡️</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          403 - Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          You do not have permission to access this page. Please return to your designated portal.
        </p>
        <button onClick={handleGoHome} className="btn btn-primary" style={{ width: '100%' }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;

