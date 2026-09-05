import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { ROUTES } from '../../../utils/constants';

const SalesAccountantDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Sales Accountant Dashboard" />

      <main className="dashboard-content">
        <div className="admin-actions-grid">
          <div
            className="action-card"
            onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}
          >
            <div className="action-icon">🪑 👥</div>
            <h3>Customer Management</h3>
            <p>Search existing customers by Customer ID (e.g. CUS-00027), Name, Email, or Mobile, and register new customers.</p>
            <button className="btn-action">Manage Customers</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesAccountantDashboard;
