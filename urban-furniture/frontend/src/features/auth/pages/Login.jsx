import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import LoginForm from '../components/LoginForm';

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
        // Direct password login without OTP (for Admin & Accountant)
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
      <LoginForm onSubmit={handleLoginSubmit} loading={loading} error={error} />
    </div>
  );
};

export default Login;
