import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import aboutImg from '../../../assets/about_furniture.png';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        navigate(ROUTES.OTP_VERIFICATION, {
          state: { userId: data.userId, isAdminSetup: true },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left decorative panel */}
      <div className="auth-split-left" aria-hidden="true">
        <img src={aboutImg} alt="" />
        <div className="auth-split-left-overlay">
          <div className="auth-split-left-text">
            <h2>Initial Admin<br />Setup</h2>
            <p>
              Create the first administrator account to start managing your Urban Furniture ERP platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="auth-split-right">
        <div className="auth-card">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-icon" aria-hidden="true">UF</div>
            <span className="auth-brand-name">Urban Furniture</span>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Admin Registration</h1>
            <p className="auth-subtitle">Initial one-time admin account setup</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password * (Min 8 characters)</label>
              <div className="input-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="form-input"
                />
                <button type="button" className="input-icon" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirmPassword" className="form-label">Confirm Password *</label>
              <div className="input-wrapper">
                <input
                  id="reg-confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="form-input"
                />
                <button type="button" className="input-icon" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" id="admin-register-submit">
              {loading ? 'Processing…' : 'Send Setup OTP →'}
            </button>
          </form>

          <div className="auth-divider">
            <p>
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="btn-link">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
