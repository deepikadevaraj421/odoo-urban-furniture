import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

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

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token || !invitationId) {
        setError('Invalid invitation link. Token or ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getInvitationInfo(invitationId, token);
        setInvitationInfo(response.data.invitation);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Invalid or expired invitation link.'
        );
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
        invitationId,
        token,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setSuccess(response.data.message || 'Password set successfully!');
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to accept invitation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <p>Verifying invitation token...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationInfo) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <div className="unauthorized-icon">⚠️</div>
          <h2 className="auth-title">Invitation Error</h2>
          <div className="alert alert-error">{error}</div>
          <button onClick={() => navigate(ROUTES.LOGIN)} className="btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Accept Invitation</h2>
          <p className="auth-subtitle">Create your password to activate your Accountant account</p>
        </div>

        {invitationInfo && (
          <div style={{ background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong style={{ color: '#00d4aa' }}>Name:</strong> {invitationInfo.name}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong style={{ color: '#00d4aa' }}>Registered Email:</strong> {invitationInfo.email}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong style={{ color: '#00d4aa' }}>Accountant ID:</strong> {invitationInfo.accountantCode}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong style={{ color: '#00d4aa' }}>Type:</strong> {invitationInfo.accountantType} Accountant</p>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="inv-password">Create New Password * (Min 8 chars)</label>
              <input
                id="inv-password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={8}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-confirmPassword">Confirm Password *</label>
              <input
                id="inv-confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={8}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Setting Password...' : 'Create Password & Activate Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
