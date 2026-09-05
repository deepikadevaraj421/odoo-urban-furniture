import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { ROUTES } from '../../../utils/constants';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Admin Dashboard" />

      <main className="dashboard-content">
        <div className="admin-actions-grid">
          <div
            className="action-card"
            onClick={() => navigate(ROUTES.ADD_ACCOUNTANT)}
          >
            <div className="action-icon">➕ 💼</div>
            <h3>Add Accountant</h3>
            <p>Create a new Sales or Purchase Accountant account with employee details and role permissions.</p>
            <button className="btn-action">+ Add Accountant</button>
          </div>

          <div
            className="action-card"
            onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}
          >
            <div className="action-icon">🪑 👥</div>
            <h3>Customer Management</h3>
            <p>Search, register, and manage customer accounts by Customer ID, Name, Email, or Mobile.</p>
            <button className="btn-action">Manage Customers</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
