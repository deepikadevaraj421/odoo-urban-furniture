import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { customerApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await customerApi.getProfile();
        setProfile(res.data.customer);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Customer Portal — My Profile" />

      <main className="dashboard-main">
        <div className="flex-between mb-4">
          <div>
            <h2>Customer Profile</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Permanent reference identity details
            </p>
          </div>
          <button onClick={() => navigate(ROUTES.CUSTOMER_DASHBOARD)} className="btn btn-outline">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading profile...
          </div>
        ) : profile && (
          <div className="card" style={{ maxWidth: '640px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: '700'
                }}
              >
                {profile.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.35rem', fontWeight: 700 }}>
                  {profile.name}
                </h3>
                <span className="badge badge-success">
                  {profile.status} CUSTOMER
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span
                  style={{
                    color: 'var(--accent)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}
                >
                  Permanent Customer ID
                </span>
                <p
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    margin: '0.25rem 0 0 0',
                    color: 'var(--text-primary)'
                  }}
                >
                  {profile.customerCode}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registered Email Address</span>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {profile.email}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mobile Number</span>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {profile.mobile || 'Not provided'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showroom Address</span>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {profile.address || 'Not provided'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Created On</span>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerProfile;

