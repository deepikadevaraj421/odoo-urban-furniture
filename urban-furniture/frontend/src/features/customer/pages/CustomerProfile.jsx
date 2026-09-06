import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import { customerApi } from '../../../services/authApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const CustomerProfile = () => {
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
    <ErpLayout title="My Profile" subtitle="Your Registered Identity Details">
      <div className="customer-dir-title-row">
        <div>
          <h2>Customer Account Profile</h2>
          <p className="subtitle">Permanent reference identity and contact details</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading profile...
        </div>
      ) : profile && (
        <div className="card" style={{ maxWidth: '680px', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{profile.name}</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{profile.email}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Customer Code
              </span>
              <p style={{ marginTop: '4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                {profile.customerCode}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Registered Mobile
              </span>
              <p style={{ marginTop: '4px', fontSize: '0.95rem', fontWeight: 600 }}>
                {profile.mobile || 'Not provided'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Account Status
              </span>
              <p style={{ marginTop: '4px' }}>
                <span className="badge badge-active">{profile.status}</span>
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Member Since
              </span>
              <p style={{ marginTop: '4px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          {profile.address && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Registered Address
              </span>
              <p style={{ marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {profile.address}
              </p>
            </div>
          )}
        </div>
      )}
    </ErpLayout>
  );
};

export default CustomerProfile;

