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

  const customerInfo = dashboardData?.customer || user;

  if (loading) {
    return (
      <div className="dashboard-container">
        <Header title="Urban Furniture" subtitle="Customer Portal" />
        <main className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your portal…</p>
          </div>
        </main>
      </div>
    );
  }

  const quickLinks = [
    {
      to: ROUTES.CUSTOMER_INVOICES,
      icon: '🧾',
      title: 'My Invoices',
      desc: 'View and download your invoices',
      id: 'customer-link-invoices',
    },
    {
      to: ROUTES.CUSTOMER_PAYMENTS,
      icon: '💳',
      title: 'My Payments',
      desc: 'Check payment history and receipts',
      id: 'customer-link-payments',
    },
    {
      to: ROUTES.CUSTOMER_PROFILE,
      icon: '👤',
      title: 'My Profile',
      desc: 'View your registered details',
      id: 'customer-link-profile',
    },
  ];

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Portal" />

      <main className="dashboard-content">
        {/* Welcome banner */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h2>Welcome, {customerInfo?.name || 'Customer'}</h2>
            <p>Manage your invoices, payments, and profile</p>
          </div>
          <div className="customer-id-badge" aria-label={`Customer ID: ${customerInfo?.customerCode}`}>
            <span className="customer-id-label">Customer ID</span>
            <span className="customer-id-value">{customerInfo?.customerCode || 'CUS-XXXXX'}</span>
          </div>
        </div>

        {error && <div className="alert alert-error" role="alert"><span>⚠</span> {error}</div>}

        {/* Quick links */}
        <div className="stats-grid" style={{ marginBottom: '28px' }}>
          {quickLinks.map((link) => (
            <Link to={link.to} key={link.title} style={{ textDecoration: 'none' }} id={link.id}>
              <div className="action-card">
                <div className="action-icon" aria-hidden="true">{link.icon}</div>
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
                <span className="btn-action">View →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Account summary */}
        <div className="card" style={{ marginTop: '4px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
            Account Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Full Name',           value: customerInfo?.name },
              { label: 'Email Address',        value: customerInfo?.email },
              { label: 'Mobile Number',        value: customerInfo?.mobile || 'Not provided' },
              { label: 'Customer ID',          value: customerInfo?.customerCode, accent: true },
            ].map((field) => (
              <div key={field.label}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {field.label}
                </span>
                <p style={{
                  marginTop: '6px',
                  fontWeight: field.accent ? 700 : 500,
                  color: field.accent ? 'var(--accent)' : 'var(--text-primary)',
                  fontFamily: field.accent ? "'SF Mono', 'Fira Code', monospace" : 'inherit',
                  fontSize: field.accent ? '1rem' : '0.95rem',
                }}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
