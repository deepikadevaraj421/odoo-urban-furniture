import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.registerAdmin(formData);
      const data = response.data;

      if (data.requiresOtp) {
        // Redirect to OTP verification with state
        navigate(ROUTES.OTP_VERIFICATION, {
          state: { userId: data.userId, isAdminSetup: true },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Admin registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Urban Furniture ERP</h2>
          <p className="auth-subtitle">Initial One-Time Admin Registration</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="System Administrator"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@urbanfurniture.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password * (Min 8 characters)</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirmPassword">Confirm Password *</label>
            <input
              id="reg-confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Register Admin (Send Setup OTP)'}
          </button>

          <div className="resend-container" style={{ marginTop: '16px' }}>
            <Link to={ROUTES.LOGIN} className="btn-link">
              Already have an Admin account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
