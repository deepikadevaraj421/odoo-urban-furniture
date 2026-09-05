import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { adminApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminApi.createCustomer(formData);
      const data = response.data;
      setSuccess(
        `Customer created successfully! Customer Code: ${data.customer.customerCode}`
      );
      setTimeout(() => {
        navigate(ROUTES.ADMIN_DASHBOARD);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create customer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Admin — Add User / Customer" />

      <main className="dashboard-content">
        <div className="form-card">
          <div className="form-header">
            <h2>Add New User (Customer)</h2>
            <button
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label htmlFor="user-name">Full Name *</label>
              <input
                id="user-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Sharma"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-email">Email Address *</label>
              <input
                id="user-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@example.com"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-mobile">Mobile Number *</label>
              <input
                id="user-mobile"
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 9876543210"
                required
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="user-address">Address</label>
              <textarea
                id="user-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Industrial Area, Phase II, Bengaluru"
                rows={3}
                className="form-input"
              />
            </div>

            <div className="form-actions full-width">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating Customer...' : 'Create User / Customer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddUser;
