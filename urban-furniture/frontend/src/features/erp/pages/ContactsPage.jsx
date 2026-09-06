import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const ContactsPage = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'ALL';
  const autoNew = searchParams.get('action') === 'new';

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState(initialType);
  const [search, setSearch] = useState('');

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(autoNew);
  const [viewingContact, setViewingContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);

  // Form states for Add
  const [formData, setFormData] = useState({
    name: '',
    type: initialType === 'VENDOR' ? 'VENDOR' : 'CUSTOMER',
    email: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Form states for Edit
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'CUSTOMER',
    email: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (search.trim()) params.search = search.trim();
      const res = await erpApi.getContacts(params);
      setContacts(res.data.contacts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contacts from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchContacts();
  }, [filterType, search]);

  // Client-side pagination calculations
  const totalRecords = contacts.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedContacts = useMemo(() => {
    return contacts.slice(startIndex, endIndex);
  }, [contacts, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.createContact(formData);
      setModalSuccess('Contact added successfully!');
      setFormData({
        name: '',
        type: 'CUSTOMER',
        email: '',
        mobile: '',
        city: '',
        state: '',
        pincode: '',
      });
      fetchContacts();
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setEditFormData({
      name: contact.name || '',
      type: contact.type || 'CUSTOMER',
      email: contact.email || '',
      mobile: contact.mobile || '',
      city: contact.city || '',
      state: contact.state || '',
      pincode: contact.pincode || '',
      status: contact.status || 'ACTIVE',
    });
    setModalError('');
    setModalSuccess('');
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!editingContact) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.updateContact(editingContact.id, editFormData);
      setModalSuccess('Contact updated successfully!');
      fetchContacts();
      setTimeout(() => {
        setEditingContact(null);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    setSubmitting(true);
    try {
      await erpApi.deleteContact(deletingContact.id);
      setDeletingContact(null);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'CUSTOMER':
        return 'badge-customer';
      case 'VENDOR':
        return 'badge-purchase';
      case 'BOTH':
        return 'badge-gold';
      default:
        return 'badge-admin';
    }
  };

  return (
    <ErpLayout title="Contacts Directory" subtitle="Manage Customers, Suppliers & Partners">
      {/* Top Header & Breadcrumb */}
      <div className="master-header-row">
        <div>
          <div className="master-breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span>Contacts</span>
            <span>&gt;</span>
            <span className="crumb-active">Contacts Directory</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Contacts Master
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Maintain complete records for furniture buyers and suppliers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add New Contact
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="card customer-search-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Email, Mobile, or City..."
            className="form-input search-field"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Contacts' },
            { key: 'CUSTOMER', label: 'Customers' },
            { key: 'VENDOR', label: 'Vendors' },
            { key: 'BOTH', label: 'Both' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab-btn ${filterType === t.key ? 'active' : ''}`}
              onClick={() => setFilterType(t.key)}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Unified Master Table Card */}
      <div className="master-table-card">
        {/* Table Toolbar */}
        <div className="master-toolbar">
          <div className="master-records-count">
            <span>Contact Records</span>
            <span className="count-pill">{totalRecords}</span>
          </div>
          <div className="master-entries-selector">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="master-select-compact"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Table Scroll View */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading contacts from PostgreSQL database...
            </div>
          ) : totalRecords === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">👥</div>
              <h3>No contact records found</h3>
              <p>Click "+ Add New Contact" to register your first partner.</p>
            </div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '180px' }}>Name</th>
                  <th style={{ minWidth: '110px' }}>Type</th>
                  <th style={{ minWidth: '220px' }}>Email</th>
                  <th style={{ minWidth: '130px' }}>Mobile</th>
                  <th style={{ minWidth: '180px' }}>Location</th>
                  <th style={{ minWidth: '95px' }}>Status</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContacts.map((c, index) => {
                  const rowNumber = startIndex + index + 1;
                  const locationString = [c.city, c.state, c.pincode].filter(Boolean).join(', ');
                  return (
                    <tr key={c.id}>
                      <td className="table-index-cell" style={{ textAlign: 'center' }}>
                        {rowNumber}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadgeClass(c.type)}`}>
                          {c.type}
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        <span
                          title={c.email || ''}
                          style={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {c.email || '—'}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {c.mobile || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {locationString || '—'}
                      </td>
                      <td>
                        <span className="badge badge-active">{c.status || 'ACTIVE'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="View Contact"
                            onClick={() => setViewingContact(c)}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="Edit Contact"
                            onClick={() => openEditModal(c)}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon btn-delete"
                            title="Delete Contact"
                            onClick={() => setDeletingContact(c)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalRecords > 0 && (
          <div className="master-pagination-bar">
            <div className="master-pagination-info">
              Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
              <strong>{totalRecords}</strong> entries
            </div>
            <div className="master-pagination-nav">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Keep first, last, and window around currentPage
                  return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && p - prevPage > 1;
                  return (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {hasGap && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>}
                      <button
                        type="button"
                        className={`page-nav-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Contact Modal ────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Create New Contact</h3>
                <p className="modal-subtitle">Add a customer or furniture vendor profile</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
            {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

            <form onSubmit={handleCreateContact}>
              <div className="form-group">
                <label className="form-label">Contact Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Modern Interiors or John Doe"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ height: '48px' }}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR">Vendor / Supplier</option>
                  <option value="BOTH">Both (Customer & Vendor)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@company.com"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Bangalore"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Karnataka"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="560001"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
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
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Contact Modal ───────────────────────────── */}
      {viewingContact && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Contact Details</h3>
                <p className="modal-subtitle">Full master profile from PostgreSQL database</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingContact(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{viewingContact.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {viewingContact.id}</span>
                </div>
                <span className={`badge ${getTypeBadgeClass(viewingContact.type)}`}>
                  {viewingContact.type}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{viewingContact.email || '—'}</p>
                </div>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mobile</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{viewingContact.mobile || '—'}</p>
                </div>
              </div>

              <div className="detail-box">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</label>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                  {[viewingContact.city, viewingContact.state, viewingContact.pincode].filter(Boolean).join(', ') || 'No address registered'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="detail-box" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                  <p style={{ margin: '4px 0 0 0' }}>
                    <span className="badge badge-active">{viewingContact.status || 'ACTIVE'}</span>
                  </p>
                </div>
                <div className="detail-box" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created Date</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.85rem' }}>
                    {viewingContact.createdAt ? formatDate(viewingContact.createdAt) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingContact(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Contact Modal ───────────────────────────── */}
      {editingContact && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Edit Contact</h3>
                <p className="modal-subtitle">Update contact details in PostgreSQL</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
            {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

            <form onSubmit={handleUpdateContact}>
              <div className="form-group">
                <label className="form-label">Contact Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Type *</label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="VENDOR">Vendor / Supplier</option>
                    <option value="BOTH">Both (Customer & Vendor)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={editFormData.mobile}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={editFormData.pincode}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────── */}
      {deletingContact && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--error)' }}>Delete Contact</h3>
              <button
                type="button"
                onClick={() => setDeletingContact(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '16px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{deletingContact.name}</strong>? This action will remove the record from PostgreSQL.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeletingContact(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteContact}
                className="btn"
                style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default ContactsPage;

