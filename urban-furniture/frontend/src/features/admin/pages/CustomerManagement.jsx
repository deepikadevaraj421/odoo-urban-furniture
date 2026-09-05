import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { ROUTES } from '../../../utils/constants';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Choose base endpoint based on logged-in user role
  const baseEndpoint = user?.role === 'ACCOUNTANT' ? '/accountant/customers' : '/admin/customers';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`${baseEndpoint}?search=${encodeURIComponent(query)}`);
      setCustomers(res.data.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await api.post(baseEndpoint, formData);
      const data = res.data;
      setModalSuccess(`Customer created successfully! Customer ID: ${data.customer.customerCode}. Invitation email sent.`);
      setFormData({ name: '', email: '', mobile: '', address: '' });
      fetchCustomers(searchQuery);
      setTimeout(() => {
        setModalSuccess('');
        setShowAddModal(false);
      }, 2500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const [resendLoadingId, setResendLoadingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const handleResendInvitation = async (customerId) => {
    setResendLoadingId(customerId);
    setError('');
    setActionSuccess('');
    try {
      const res = await api.post(`${baseEndpoint}/${customerId}/resend-invitation`);
      setActionSuccess(res.data.message || 'Invitation resent successfully.');
      fetchCustomers(searchQuery);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend invitation.');
    } finally {
      setResendLoadingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Customer Directory" />

      <main className="dashboard-main">
        <div className="flex-between mb-4">
          <div>
            <h2>Customer Directory</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Search and manage customer accounts by Customer ID, Name, Email, or Mobile
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Add New Customer
          </button>
        </div>

        {/* Search Bar Card */}
        <div className="card mb-4" style={{ padding: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              htmlFor="customer-search"
              style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                display: 'block'
              }}
            >
              🔍 Search Existing Customers
            </label>
            <input
              id="customer-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Customer ID (e.g. CUS-00005), Name, Email, or Mobile..."
              className="form-input"
            />
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

        {/* Customers Table Container */}
        <div className="table-container card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No customer records found</h3>
              <p>
                {searchQuery
                  ? `No customer matched "${searchQuery}". Click "+ Add New Customer" to register.`
                  : 'Click "+ Add New Customer" to register your first customer.'}
              </p>
            </div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {customer.customerCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{customer.email}</td>
                    <td>{customer.mobile}</td>
                    <td>
                      <span className={`badge ${customer.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {customer.status === 'INVITED' && (
                        <button
                          onClick={() => handleResendInvitation(customer.id)}
                          disabled={resendLoadingId === customer.id}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          {resendLoadingId === customer.id ? 'Sending...' : '✉️ Resend Invitation'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="flex-between mb-4">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Register New Customer</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Customer ID will be generated automatically (e.g. CUS-00001)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
              {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

              <form onSubmit={handleAddCustomerSubmit}>
                <div className="form-group">
                  <label htmlFor="cust-name">Full Name *</label>
                  <input
                    id="cust-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cust-email">Email Address *</label>
                  <input
                    id="cust-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cust-mobile">Mobile Number *</label>
                  <input
                    id="cust-mobile"
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    placeholder="Enter mobile number"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cust-address">Address</label>
                  <textarea
                    id="cust-address"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Enter address"
                    rows={3}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {submitting ? 'Creating...' : 'Register Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerManagement;

