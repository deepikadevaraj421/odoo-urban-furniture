import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import ErpLayout from '../../../components/layout/ErpLayout';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const CustomerManagement = () => {
  const { user } = useAuth();

  // Choose base endpoint based on logged-in user role
  const baseEndpoint =
    user?.role === 'ACCOUNTANT' ? '/accountant/customers' : '/admin/customers';

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
      const res = await api.get(
        `${baseEndpoint}?search=${encodeURIComponent(query)}`
      );
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
      setModalSuccess(
        `Customer created! ID: ${data.customer.customerCode}. Invitation email sent.`
      );
      setFormData({ name: '', email: '', mobile: '', address: '' });
      fetchCustomers(searchQuery);
      setTimeout(() => {
        setModalSuccess('');
        setShowAddModal(false);
      }, 2500);
    } catch (err) {
      setModalError(
        err.response?.data?.message || 'Failed to create customer.'
      );
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
      const res = await api.post(
        `${baseEndpoint}/${customerId}/resend-invitation`
      );
      setActionSuccess(res.data.message || 'Invitation resent successfully.');
      fetchCustomers(searchQuery);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to resend invitation.'
      );
    } finally {
      setResendLoadingId(null);
    }
  };

  return (
    <ErpLayout title="Urban Furniture ERP" subtitle="Customer Directory">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="cd-page-header">
        <div className="cd-page-header-text">
          <h2 className="cd-page-title">Customer Directory</h2>
          <p className="cd-page-subtitle">
            Search and manage customer accounts by Customer ID, Name, Email, or
            Mobile
          </p>
        </div>
        <button
          id="btn-add-customer"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary cd-btn-add"
        >
          <span aria-hidden="true">+</span> Add New Customer
        </button>
      </div>

      {/* ── Search Card ──────────────────────────────────────── */}
      <div className="cd-search-card">
        <label htmlFor="customer-search" className="cd-search-label">
          🔎&nbsp; Search Customers
        </label>
        <input
          id="customer-search"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by Customer ID (e.g. CUS-00005), Name, Email, or Mobile…"
          className="form-input cd-search-input"
        />
      </div>

      {/* ── Alerts ───────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error cd-alert">{error}</div>
      )}
      {actionSuccess && (
        <div className="alert alert-success cd-alert">{actionSuccess}</div>
      )}

      {/* ── Customer Table ───────────────────────────────────── */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>All Customers</h3>
          <span className="cd-record-count">
            {!loading && `${customers.length} record${customers.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="cd-loading">
            <span className="cd-loading-spinner" />
            Loading customer directory…
          </div>
        ) : customers.length === 0 ? (
          <div className="cd-empty-state">
            <div className="cd-empty-icon">👥</div>
            <h4>No customer records found</h4>
            <p>
              {searchQuery
                ? `No match for "${searchQuery}". Try a different search or add a new customer.`
                : 'Click "+ Add New Customer" to register your first customer.'}
            </p>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table cd-table">
              <thead>
                <tr>
                  <th className="cd-col-id">Customer ID</th>
                  <th className="cd-col-name">Full Name</th>
                  <th className="cd-col-email">Email Address</th>
                  <th className="cd-col-mobile">Mobile</th>
                  <th className="cd-col-status">Status</th>
                  <th className="cd-col-date">Created Date</th>
                  <th className="cd-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    {/* Customer ID */}
                    <td className="cd-col-id">
                      <span className="cd-customer-code">
                        {customer.customerCode}
                      </span>
                    </td>

                    {/* Full Name */}
                    <td
                      className="cd-col-name cd-cell-truncate"
                      title={customer.name}
                    >
                      <span className="cd-name-text">{customer.name}</span>
                    </td>

                    {/* Email */}
                    <td
                      className="cd-col-email cd-cell-truncate"
                      title={customer.email}
                    >
                      {customer.email}
                    </td>

                    {/* Mobile */}
                    <td className="cd-col-mobile">
                      {customer.mobile || <span className="cd-na">—</span>}
                    </td>

                    {/* Status */}
                    <td className="cd-col-status">
                      <span
                        className={`cd-badge ${
                          customer.status === 'ACTIVE'
                            ? 'cd-badge-active'
                            : 'cd-badge-invited'
                        }`}
                      >
                        {customer.status === 'ACTIVE' ? '● Active' : '○ Invited'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="cd-col-date">
                      {formatDate(customer.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="cd-col-actions">
                      {customer.status === 'INVITED' ? (
                        <button
                          onClick={() => handleResendInvitation(customer.id)}
                          disabled={resendLoadingId === customer.id}
                          className="btn btn-secondary btn-sm cd-btn-resend"
                        >
                          {resendLoadingId === customer.id
                            ? 'Sending…'
                            : '✉ Resend Invite'}
                        </button>
                      ) : (
                        <span className="cd-action-empty">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Customer Modal ───────────────────────────────── */}
      {showAddModal && (
        <div
          className="cd-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="cd-modal-card">
            {/* Modal Header */}
            <div className="cd-modal-head">
              <div>
                <h3 id="modal-title" className="cd-modal-title">
                  Register New Customer
                </h3>
                <p className="cd-modal-subtitle">
                  Customer ID is auto-generated (e.g.&nbsp;CUS-00001)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cd-modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Alerts */}
            {modalError && (
              <div className="alert alert-error cd-alert">{modalError}</div>
            )}
            {modalSuccess && (
              <div className="alert alert-success cd-alert">{modalSuccess}</div>
            )}

            {/* Form */}
            <form onSubmit={handleAddCustomerSubmit} className="cd-modal-form">
              <div className="form-group">
                <label htmlFor="cust-name" className="form-label">
                  Full Name <span className="cd-required">*</span>
                </label>
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
                <label htmlFor="cust-email" className="form-label">
                  Email Address <span className="cd-required">*</span>
                </label>
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
                <label htmlFor="cust-mobile" className="form-label">
                  Mobile Number <span className="cd-required">*</span>
                </label>
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
                <label htmlFor="cust-address" className="form-label">
                  Address
                </label>
                <textarea
                  id="cust-address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Enter address (optional)"
                  rows={3}
                  className="form-input cd-textarea"
                />
              </div>

              <div className="cd-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Creating…' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default CustomerManagement;

