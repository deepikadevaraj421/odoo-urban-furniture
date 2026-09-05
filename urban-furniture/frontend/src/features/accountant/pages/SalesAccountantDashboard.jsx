import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { ROUTES } from '../../../utils/constants';

const SalesAccountantDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Sales & AR Portal" />

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>Sales Accountant Portal</h2>
          <p>Manage customer directory, send invitations, and process sales transactions.</p>
        </div>

        <div className="dashboard-grid">
          <div
            className="action-card primary"
            onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}
          >
            <div className="action-icon">👥</div>
            <h3>Customer Management</h3>
            <p>Search existing customers by Customer ID (e.g. CUS-00005), Name, or Email, and register new customers with automated invitations.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              Manage Customers →
            </button>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">🧾</div>
            <h3>Sales Invoices</h3>
            <p>Generate, issue, and manage customer invoices and accounts receivable balances.</p>
            <span className="badge badge-warning" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Coming Soon</span>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">💳</div>
            <h3>Payment Receipts</h3>
            <p>Record customer payments, issue receipts, and reconcile bank entries.</p>
            <span className="badge badge-warning" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesAccountantDashboard;

