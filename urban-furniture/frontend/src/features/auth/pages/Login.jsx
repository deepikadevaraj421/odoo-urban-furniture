import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import LoginForm from '../components/LoginForm';
import heroImg from '../../../assets/hero_furniture.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(formData);
      const data = response.data;

      if (data.token && data.user) {
        login(data.token, data.user);
        navigate(data.redirectTo || ROUTES.ADMIN_DASHBOARD);
      } else if (data.requiresOtp) {
        navigate(ROUTES.OTP_VERIFICATION, {
          state: { userId: data.userId },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left panel — decorative */}
      <div className="auth-split-left" aria-hidden="true">
        <img src={heroImg} alt="" />
        <div className="auth-split-left-overlay">
          <div className="auth-split-left-text">
            <h2>Premium Furniture<br />Management ERP</h2>
            <p>
              Manage your inventory, customers, invoices, and payments — all in one elegant platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="auth-split-right">
        <LoginForm onSubmit={handleLoginSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default Login;
