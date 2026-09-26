import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import heroImg from '../../../assets/hero_furniture.png';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const invitationId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) {
        setError('Invalid invitation link. Token is missing.');
        setLoading(false);
        return;
      }
      try {
        const response = await authApi.getInvitationInfo(invitationId || '', token);
        setInvitationInfo(response.data.invitation);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token, invitationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await authApi.acceptInvitation({
        invitationId: invitationId || invitationInfo?.id || '',
        token,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSuccess(response.data.message || 'Password set successfully!');
      setTimeout(() => navigate(ROUTES.LOGIN), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page-container">
        <div className="auth-split-left" aria-hidden="true">
          <img src={heroImg} alt="" />
          <div className="auth-split-left-overlay">
            <div className="auth-split-left-text">
              <h2>Welcome to<br />Urban Furniture</h2>
              <p>Set up your account to get started.</p>
            </div>
          </div>
        </div>
        <div className="auth-split-right">
          <div className="auth-card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your invitation…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitationInfo) {
    return (
      <div className="auth-page-container">
        <div className="auth-split-left" aria-hidden="true">
          <img src={heroImg} alt="" />
          <div className="auth-split-left-overlay" />
        </div>
        <div className="auth-split-right">
          <div className="auth-card text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
            <h2 className="auth-title" style={{ marginBottom: '16px' }}>Invitation Error</h2>
            <div className="alert alert-error" role="alert">{error}</div>
            <button onClick={() => navigate(ROUTES.LOGIN)} className="btn btn-primary btn-full">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      {/* Left panel */}
      <div className="auth-split-left" aria-hidden="true">
        <img src={heroImg} alt="" />
        <div className="auth-split-left-overlay">
          <div className="auth-split-left-text">
            <h2>Welcome to<br />Urban Furniture</h2>
            <p>Create your password to activate your account and access the ERP platform.</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-split-right">
        <div className="auth-card">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-icon" aria-hidden="true">UF</div>
            <span className="auth-brand-name">Urban Furniture</span>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Accept Invitation</h1>
            <p className="auth-subtitle">Create your password to activate your account</p>
          </div>

          {/* Invitation info */}
          {invitationInfo && (
            <div className="invitation-info" aria-label="Your account details">
              <p><strong>Name:</strong> {invitationInfo.name}</p>
              <p><strong>Email:</strong> {invitationInfo.email}</p>
              {invitationInfo.customerCode && (
                <p><strong>Customer ID:</strong> {invitationInfo.customerCode}</p>
              )}
              {invitationInfo.accountantCode && (
                <p><strong>Accountant ID:</strong> {invitationInfo.accountantCode}</p>
              )}
              {invitationInfo.accountantType && (
                <p><strong>Type:</strong> {invitationInfo.accountantType} Accountant</p>
              )}
            </div>
          )}

          {error && <div className="alert alert-error" role="alert"><span>⚠</span> {error}</div>}
          {success && <div className="alert alert-success" role="status">✓ {success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="inv-password" className="form-label">Create New Password * (Min 8 chars)</label>
                <div className="input-wrapper">
                  <input
                    id="inv-password"
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
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
                <label htmlFor="inv-confirmPassword" className="form-label">Confirm Password *</label>
                <div className="input-wrapper">
                  <input
                    id="inv-confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
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

              <button type="submit" disabled={submitting} className="btn btn-primary btn-full" id="accept-invitation-submit">
                {submitting ? 'Activating Account…' : 'Create Password & Activate Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
