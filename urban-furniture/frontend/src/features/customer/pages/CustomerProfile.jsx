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
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Portal — My Profile" />

      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#f3f4f6', margin: '0 0 4px 0' }}>Customer Profile</h2>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>Permanent reference identity details</p>
          </div>
          <button onClick={() => navigate(ROUTES.CUSTOMER_DASHBOARD)} className="btn-secondary">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading profile...</div>
        ) : profile && (
          <div style={{ background: '#111827', padding: '32px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', borderBottom: '1px solid #1f2937', paddingBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800' }}>
                {profile.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#f3f4f6', fontSize: '1.4rem' }}>{profile.name}</h3>
                <span className="badge badge-active" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(0, 212, 170, 0.2)', color: '#00d4aa', border: '1px solid #00d4aa' }}>
                  {profile.status} CUSTOMER
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ background: '#16213e', padding: '16px', borderRadius: '8px' }}>
                <span style={{ color: '#00d4aa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Permanent Customer ID</span>
                <p style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{profile.customerCode}</p>
              </div>

              <div>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Registered Email Address</span>
                <p style={{ color: '#e5e7eb', fontSize: '1.05rem', fontWeight: '600', margin: '4px 0 0 0' }}>{profile.email}</p>
              </div>

              <div>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Mobile Number</span>
                <p style={{ color: '#e5e7eb', fontSize: '1.05rem', fontWeight: '600', margin: '4px 0 0 0' }}>{profile.mobile || 'Not provided'}</p>
              </div>

              <div>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Showroom Address</span>
                <p style={{ color: '#e5e7eb', fontSize: '1.05rem', fontWeight: '600', margin: '4px 0 0 0' }}>{profile.address || 'Not provided'}</p>
              </div>

              <div>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Account Created On</span>
                <p style={{ color: '#e5e7eb', fontSize: '1.05rem', fontWeight: '600', margin: '4px 0 0 0' }}>{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerProfile;
