import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { ROUTES } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    { icon: '📊', label: 'Total Customers', value: '—', color: 'green' },
    { icon: '💰', label: 'Total Sales',     value: '—', color: 'gold'  },
    { icon: '🧾', label: 'Open Invoices',   value: '—', color: 'blue'  },
    { icon: '📦', label: 'Products',        value: '—', color: 'green' },
  ];

  const actions = [
    {
      icon: '👥',
      title: 'Customer Management',
      desc: 'Search, register, and manage customer accounts by Customer ID, Name, Email, or Mobile.',
      btnLabel: 'Manage Customers',
      route: ROUTES.CUSTOMER_MANAGEMENT,
      id: 'admin-action-customers',
    },
    {
      icon: '💼',
      title: 'Add Accountant',
      desc: 'Create a new Sales or Purchase Accountant account with employee details and role permissions.',
      btnLabel: 'Add Accountant',
      route: ROUTES.ADD_ACCOUNTANT,
      id: 'admin-action-accountant',
    },
  ];

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture ERP" subtitle="Admin Dashboard" />

      <main className="dashboard-content">
        {/* Welcome */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name || 'Admin'}</h2>
            <p>Here's an overview of your Urban Furniture ERP platform.</p>
          </div>
          <span className="badge badge-admin" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            Administrator
          </span>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.color}`} aria-hidden="true">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Section heading */}
        <div className="page-heading">
          <h2>Quick Actions</h2>
          <p>Manage core ERP functions from here.</p>
        </div>

        {/* Action cards */}
        <div className="admin-actions-grid">
          {actions.map((a) => (
            <div
              key={a.title}
              className="action-card"
              onClick={() => navigate(a.route)}
              role="button"
              tabIndex={0}
              id={a.id}
              onKeyDown={(e) => e.key === 'Enter' && navigate(a.route)}
              aria-label={a.title}
            >
              <div className="action-icon" aria-hidden="true">{a.icon}</div>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
              <button className="btn-action" tabIndex={-1}>{a.btnLabel}</button>
            </div>
          ))}

          {/* Coming soon modules */}
          {[
            { icon: '🧾', title: 'Invoices', desc: 'Manage sales invoices and billing records.' },
            { icon: '📦', title: 'Products', desc: 'Manage your furniture product catalogue.' },
            { icon: '📊', title: 'Reports',  desc: 'Sales, purchase, and financial reports.' },
          ].map((m) => (
            <div
              key={m.title}
              className="action-card"
              style={{ opacity: 0.65, cursor: 'not-allowed' }}
              aria-disabled="true"
              title="Coming soon"
            >
              <div className="action-icon" aria-hidden="true">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--accent-gold)',
                fontWeight: 600,
                background: 'var(--accent-gold-light)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(201,169,110,0.2)',
              }}>Coming Soon</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
