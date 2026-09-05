import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { adminApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const AddAccountant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    employeeId: '',
    department: 'Accounting',
    accountantType: 'SALES',
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
      const response = await adminApi.createAccountant(formData);
      const data = response.data;
      setSuccess(
        `Accountant created successfully!\nAccountant ID: ${data.accountant.accountantCode}\nInvitation sent to: ${data.accountant.email}`
      );
      setTimeout(() => {
        navigate(ROUTES.ADMIN_DASHBOARD);
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create accountant.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Admin Portal" />

      <main className="dashboard-main" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="card">
          <div className="flex-between mb-4">
            <div>
              <h2>Add New Accountant</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                Create an accountant user and dispatch an email invitation link.
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              className="btn btn-outline"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}
          {success && (
            <div className="alert alert-success mb-4" style={{ whiteSpace: 'pre-line' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="acc-name">Full Name *</label>
                <input
                  id="acc-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Arun Kumar"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="acc-email">Email Address *</label>
                <input
                  id="acc-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="arun@gmail.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="acc-mobile">Mobile Number *</label>
                <input
                  id="acc-mobile"
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="acc-employeeId">Employee ID *</label>
                <input
                  id="acc-employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="UF-ACC-001"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="acc-department">Department *</label>
                <input
                  id="acc-department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Finance & Accounting"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="acc-accountantType">Accountant Type *</label>
                <select
                  id="acc-accountantType"
                  name="accountantType"
                  value={formData.accountantType}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="SALES">Sales Accountant</option>
                  <option value="PURCHASE">Purchase Accountant</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddAccountant;

