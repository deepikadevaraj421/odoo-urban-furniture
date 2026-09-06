import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import PermissionDrawer from '../components/PermissionDrawer';
import { adminApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const AddAccountant = () => {
  const navigate = useNavigate();

  const [accountants, setAccountants] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedAccountant, setSelectedAccountant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Accountant form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    employeeId: '',
    department: 'Accounting',
    accountantType: 'SALES',
  });
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');

  // Fetch accountants on mount
  const fetchAccountants = async () => {
    setLoadingList(true);
    try {
      const res = await adminApi.getAccountants();
      setAccountants(res.data.accountants || []);
    } catch (err) {
      console.error('Failed to load accountants:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAccountants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoadingAdd(true);
    setAddError('');
    setAddSuccess('');

    try {
      const response = await adminApi.createAccountant(formData);
      const data = response.data;
      setAddSuccess(
        `Accountant created successfully!\nAccountant Code: ${data.accountant.accountantCode}\nInvitation link emailed to: ${data.accountant.email}`
      );
      setFormData({
        name: '',
        email: '',
        mobile: '',
        employeeId: '',
        department: 'Accounting',
        accountantType: 'SALES',
      });
      fetchAccountants();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess('');
      }, 2500);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create accountant.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleOpenPermissions = (acc) => {
    setSelectedAccountant(acc);
    setIsDrawerOpen(true);
  };

  const handlePermissionsSaved = (updatedAccountant) => {
    setAccountants((prev) =>
      prev.map((a) => (a.id === updatedAccountant.id ? { ...a, ...updatedAccountant } : a))
    );
    setGeneralSuccess(
      `Permissions updated in database for ${updatedAccountant.name} (${updatedAccountant.accountantCode})`
    );
    setTimeout(() => {
      setGeneralSuccess('');
    }, 4000);
  };

  return (
    <ErpLayout
      title="Urban Furniture ERP"
      subtitle="Accountant Management & Granular Access Control"
    >
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700 }}>
            Accountants & Permissions
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage financial officers, dispatch setup invitations, and configure database-persisted access controls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            ← Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Add New Accountant
          </button>
        </div>
      </div>

      {generalSuccess && (
        <div className="alert alert-success mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span>
          <span>{generalSuccess}</span>
        </div>
      )}

      {/* Accountants Table Card */}
      <div className="erp-card-table">
        <div className="erp-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Registered Accountants ({accountants.length})</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Database-backed access rules
          </span>
        </div>

        <div className="erp-table-scroll">
          {loadingList ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading accountants from database...
            </div>
          ) : accountants.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No accountants found in the system. Click "+ Add New Accountant" to invite one.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Accountant Code</th>
                  <th>Name / Email</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th style={{ textAlign: 'right' }}>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {accountants.map((acc) => {
                  const permCount = acc.permissions ? acc.permissions.length : 0;
                  return (
                    <tr key={acc.id}>
                      <td>
                        <span className="customer-code" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {acc.accountantCode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{acc.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{acc.employeeId}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{acc.department || 'Accounting'}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              acc.accountantType === 'SALES'
                                ? 'rgba(46, 160, 67, 0.15)'
                                : 'rgba(219, 109, 40, 0.15)',
                            color: acc.accountantType === 'SALES' ? '#3fb950' : '#f0883e',
                            border: `1px solid ${
                              acc.accountantType === 'SALES'
                                ? 'rgba(46, 160, 67, 0.3)'
                                : 'rgba(219, 109, 40, 0.3)'
                            }`,
                          }}
                        >
                          {acc.accountantType}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background:
                              acc.status === 'ACTIVE'
                                ? 'rgba(46, 160, 67, 0.2)'
                                : 'rgba(227, 179, 65, 0.2)',
                            color: acc.status === 'ACTIVE' ? '#3fb950' : '#d29922',
                          }}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            background: 'rgba(56, 139, 253, 0.12)',
                            color: '#58a6ff',
                            border: '1px solid rgba(56, 139, 253, 0.25)',
                          }}
                        >
                          {permCount} enabled
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenPermissions(acc)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>⚙️</span> Manage Permissions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Permission Drawer */}
      <PermissionDrawer
        isOpen={isDrawerOpen}
        accountant={selectedAccountant}
        onClose={() => setIsDrawerOpen(false)}
        onPermissionsSaved={handlePermissionsSaved}
      />

      {/* Add New Accountant Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            padding: '20px',
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary, #161b22)',
              border: '1px solid var(--border, #30363d)',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700 }}>
                  Add New Accountant
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Create an accountant account and dispatch an activation invitation email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {addError && <div className="alert alert-error mb-4">{addError}</div>}
            {addSuccess && (
              <div className="alert alert-success mb-4" style={{ whiteSpace: 'pre-line' }}>
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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
                    placeholder="UF-ACC-003"
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
                    placeholder="Finance & Accounts"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loadingAdd} className="btn btn-primary">
                  {loadingAdd ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default AddAccountant;
