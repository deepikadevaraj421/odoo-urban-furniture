import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGIN_TYPES } from '../../../utils/constants';

const LoginForm = ({ onSubmit, loading, error }) => {
  const [loginType, setLoginType] = useState(LOGIN_TYPES.ADMIN);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (type) => {
    setLoginType(type);
    setFormData({
      email: '',
      password: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ loginType, ...formData });
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="auth-title">Urban Furniture ERP</h2>
        <p className="auth-subtitle">Sign in to your account</p>
      </div>

      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${loginType === LOGIN_TYPES.ADMIN ? 'active' : ''}`}
          onClick={() => handleTabChange(LOGIN_TYPES.ADMIN)}
        >
          Admin
        </button>
        <button
          type="button"
          className={`tab-btn ${loginType === LOGIN_TYPES.ACCOUNTANT ? 'active' : ''}`}
          onClick={() => handleTabChange(LOGIN_TYPES.ACCOUNTANT)}
        >
          Accountant
        </button>
        <button
          type="button"
          className={`tab-btn ${loginType === LOGIN_TYPES.CUSTOMER ? 'active' : ''}`}
          onClick={() => handleTabChange(LOGIN_TYPES.CUSTOMER)}
        >
          Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        {loginType === LOGIN_TYPES.ADMIN && (
          <>
            <div className="form-group">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="form-input"
              />
            </div>
          </>
        )}

        {loginType === LOGIN_TYPES.ACCOUNTANT && (
          <>
            <div className="form-group">
              <label htmlFor="accountant-email">Registered Email Address</label>
              <input
                id="accountant-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="accountant-password">Password</label>
              <input
                id="accountant-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="form-input"
              />
            </div>
          </>
        )}

        {loginType === LOGIN_TYPES.CUSTOMER && (
          <>
            <div className="form-group">
              <label htmlFor="customer-email">Registered Email Address</label>
              <input
                id="customer-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer-password">Password</label>
              <input
                id="customer-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="form-input"
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Authenticating...' : 'Login'}
        </button>

        {loginType === LOGIN_TYPES.ADMIN && (
          <div className="resend-container" style={{ marginTop: '16px' }}>
            <Link to="/admin/register" className="btn-link">
              First time setup? Register Initial Admin Account
            </Link>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
