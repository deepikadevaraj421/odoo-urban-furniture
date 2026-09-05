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
            onClick={() => navigate(ROUTES.ADD_USER)}
          >
            <div className="action-icon">➕ 👤</div>
            <h3>Add User</h3>
            <p>Register a new Customer / User account with basic profile details and auto-generated customer code.</p>
            <button className="btn-action">+ Add User</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
