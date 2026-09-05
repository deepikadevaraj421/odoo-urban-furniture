import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGIN_TYPES } from '../../../utils/constants';

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LoginForm = ({ onSubmit, loading, error }) => {
  const [loginType, setLoginType] = useState(LOGIN_TYPES.ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (type) => {
    setLoginType(type);
    setFormData({ email: '', password: '' });
    setShowPassword(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ loginType, ...formData });
  };

  const roleLabels = {
    [LOGIN_TYPES.ADMIN]:      { label: 'Admin',      emailLabel: 'Admin Email' },
    [LOGIN_TYPES.ACCOUNTANT]: { label: 'Accountant', emailLabel: 'Registered Email' },
    [LOGIN_TYPES.CUSTOMER]:   { label: 'Customer',   emailLabel: 'Registered Email' },
  };

  return (
    <div className="auth-card">
      {/* Brand */}
      <div className="auth-brand">
        <div className="auth-brand-icon" aria-hidden="true">UF</div>
        <span className="auth-brand-name">Urban Furniture</span>
      </div>

      {/* Heading */}
      <div className="auth-header">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Urban Furniture ERP account</p>
      </div>

      {/* Role tabs */}
      <div className="tab-container" role="tablist" aria-label="Login role">
        {Object.values(LOGIN_TYPES).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={loginType === type}
            className={`tab-btn${loginType === type ? ' active' : ''}`}
            onClick={() => handleTabChange(type)}
          >
            {roleLabels[type].label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor={`${loginType.toLowerCase()}-email`} className="form-label">
            {roleLabels[loginType].emailLabel}
          </label>
          <input
            id={`${loginType.toLowerCase()}-email`}
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
          <label htmlFor={`${loginType.toLowerCase()}-password`} className="form-label">
            Password
          </label>
          <div className="input-wrapper">
            <input
              id={`${loginType.toLowerCase()}-password`}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="form-input"
            />
            <button
              type="button"
              className="input-icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-full"
          id="login-submit-btn"
        >
          {loading ? 'Authenticating…' : 'Login'}
        </button>
      </form>

      {/* Footer links */}
      <div className="auth-divider">
        {loginType === LOGIN_TYPES.ADMIN && (
          <p>
            First time setup?{' '}
            <Link to="/admin/register" className="btn-link">
              Register Initial Admin Account
            </Link>
          </p>
        )}
        {loginType !== LOGIN_TYPES.ADMIN && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Your account is created by an administrator via invitation.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
