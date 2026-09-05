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
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Management" />

      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ color: '#f3f4f6', margin: '0 0 4px 0' }}>Customer Directory</h2>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>Search and manage customer accounts by Customer ID, Name, Email, or Mobile</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+ Add New Customer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ background: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #1f2937', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="customer-search" style={{ color: '#9ca3af', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔍 Search Existing Customers
            </label>
            <input
              id="customer-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Customer ID (e.g. CUS-00027), Name, Email, or Mobile..."
              className="form-input"
              style={{ background: '#1f2937', borderColor: '#374151', color: '#f3f4f6', fontSize: '1rem', padding: '12px 16px' }}
            />
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
        {actionSuccess && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{actionSuccess}</div>}

        {/* Customers Table */}
        <div className="table-container" style={{ background: '#111827', borderRadius: '10px', border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading customers...</div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No customer records found.</p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {searchQuery ? `No customer matched "${searchQuery}". Click "+ Add New Customer" to register.` : 'Click "+ Add New Customer" to register your first customer.'}
              </p>
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Customer ID</th>
                  <th style={{ padding: '14px 16px' }}>Full Name</th>
                  <th style={{ padding: '14px 16px' }}>Email Address</th>
                  <th style={{ padding: '14px 16px' }}>Mobile</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Created Date</th>
                  <th style={{ padding: '14px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#00d4aa' }}>{customer.customerCode}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{customer.name}</td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{customer.email}</td>
                    <td style={{ padding: '14px 16px', color: '#d1d5db' }}>{customer.mobile}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${customer.status === 'ACTIVE' ? 'badge-active' : 'badge-invited'}`} style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: customer.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: customer.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${customer.status === 'ACTIVE' ? '#10b981' : '#f59e0b'}`,
                      }}>
                        {customer.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: '0.85rem' }}>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {customer.status === 'INVITED' && (
                        <button
                          onClick={() => handleResendInvitation(customer.id)}
                          disabled={resendLoadingId === customer.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: '#374151',
                            color: '#60a5fa',
                            border: '1px solid #4b5563',
                            cursor: 'pointer',
                          }}
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="auth-card" style={{ maxWidth: '500px', width: '100%', background: '#111827', border: '1px solid #1f2937' }}>
              <div className="auth-header">
                <h3 className="auth-title">Register New Customer</h3>
                <p className="auth-subtitle">Customer ID will be generated automatically (e.g. CUS-00001)</p>
              </div>

              {modalError && <div className="alert alert-error">{modalError}</div>}
              {modalSuccess && <div className="alert alert-success">{modalSuccess}</div>}

              <form onSubmit={handleAddCustomerSubmit} className="auth-form">
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
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
