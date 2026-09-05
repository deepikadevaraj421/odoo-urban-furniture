import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { customerApi } from '../../../services/authApi';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await customerApi.getDashboard();
        setDashboardData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Header title="Urban Furniture" subtitle="Customer Dashboard" />
        <main className="dashboard-content" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af' }}>Loading customer portal...</p>
        </main>
      </div>
    );
  }

  const customerInfo = dashboardData?.customer || user;

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Portal" />

      <main className="dashboard-content">
        {/* Welcome Header */}
        <div style={{ background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)', padding: '28px', borderRadius: '12px', marginBottom: '28px', border: '1px solid #1f2937', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.8rem', fontWeight: '700' }}>
                Welcome, {customerInfo?.name || 'Customer'}
              </h2>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.95rem' }}>
                Manage your invoices, payments, and profile records
              </p>
            </div>
            <div style={{ background: 'rgba(0, 212, 170, 0.15)', border: '1px solid #00d4aa', padding: '10px 20px', borderRadius: '30px', textAlign: 'center' }}>
              <span style={{ color: '#a0a0b0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Customer ID</span>
              <strong style={{ color: '#00d4aa', fontSize: '1.2rem', fontFamily: 'monospace' }}>{customerInfo?.customerCode || 'CUS-XXXXX'}</strong>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <Link to={ROUTES.CUSTOMER_INVOICES} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧾</div>
              <h3 style={{ color: '#f3f4f6', margin: '0 0 6px 0' }}>My Invoices</h3>
              <p style={{ color: '#9ca3af', margin: '0 0 12px 0', fontSize: '0.9rem' }}>View and download invoices for Customer ID {customerInfo?.customerCode}</p>
              <span style={{ color: '#00d4aa', fontWeight: '600', fontSize: '0.9rem' }}>View Invoices →</span>
            </div>
          </Link>

          <Link to={ROUTES.CUSTOMER_PAYMENTS} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💳</div>
              <h3 style={{ color: '#f3f4f6', margin: '0 0 6px 0' }}>My Payments</h3>
              <p style={{ color: '#9ca3af', margin: '0 0 12px 0', fontSize: '0.9rem' }}>Check payment history and receipts linked to {customerInfo?.customerCode}</p>
              <span style={{ color: '#00d4aa', fontWeight: '600', fontSize: '0.9rem' }}>View Payments →</span>
            </div>
          </Link>

          <Link to={ROUTES.CUSTOMER_PROFILE} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👤</div>
              <h3 style={{ color: '#f3f4f6', margin: '0 0 6px 0' }}>My Profile</h3>
              <p style={{ color: '#9ca3af', margin: '0 0 12px 0', fontSize: '0.9rem' }}>Review your registered contact details and Customer ID</p>
              <span style={{ color: '#00d4aa', fontWeight: '600', fontSize: '0.9rem' }}>View Profile →</span>
            </div>
          </Link>
        </div>

        {/* Account Details Summary */}
        <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ color: '#f3f4f6', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>Account Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Full Name</span>
              <p style={{ color: '#e5e7eb', fontWeight: '600', margin: '4px 0 0 0' }}>{customerInfo?.name}</p>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Email Address</span>
              <p style={{ color: '#e5e7eb', fontWeight: '600', margin: '4px 0 0 0' }}>{customerInfo?.email}</p>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Mobile Number</span>
              <p style={{ color: '#e5e7eb', fontWeight: '600', margin: '4px 0 0 0' }}>{customerInfo?.mobile || 'Not provided'}</p>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Permanent Customer ID</span>
              <p style={{ color: '#00d4aa', fontWeight: '700', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{customerInfo?.customerCode}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
