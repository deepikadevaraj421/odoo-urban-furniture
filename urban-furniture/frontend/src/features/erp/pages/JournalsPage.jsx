import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';

const JournalsPage = () => {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'GENERAL',
    defaultAccountId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([
        erpApi.getJournals(),
        erpApi.getAccounts(),
      ]);
      setJournals(jRes.data.journals || []);
      setAccounts(aRes.data.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load journals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await erpApi.createJournal(formData);
      setShowModal(false);
      setActionSuccess(`Journal "${formData.name}" created successfully!`);
      setFormData({ code: '', name: '', type: 'GENERAL', defaultAccountId: '' });
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create journal.');
    } finally {
      setSubmitting(false);
    }
  };

  const getJournalTypeBadge = (type) => {
    switch (type) {
      case 'SALES':
        return <span className="badge badge-sales" style={{ background: 'rgba(46,125,50,0.12)', color: '#2e7d32' }}>SALES</span>;
      case 'PURCHASE':
        return <span className="badge badge-purchase" style={{ background: 'rgba(211,47,47,0.12)', color: '#d32f2f' }}>PURCHASE</span>;
      case 'BANK':
        return <span className="badge" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>BANK</span>;
      case 'CASH':
        return <span className="badge" style={{ background: 'rgba(245,124,0,0.12)', color: '#f57c00' }}>CASH</span>;
      default:
        return <span className="badge badge-admin" style={{ background: 'rgba(106,27,154,0.12)', color: '#6a1b9a' }}>GENERAL</span>;
    }
  };

  const filteredJournals = filterType === 'ALL'
    ? journals
    : journals.filter((j) => j.type === filterType);

  const salesCount = journals.filter((j) => j.type === 'SALES').length;
  const purchaseCount = journals.filter((j) => j.type === 'PURCHASE').length;
  const cashBankCount = journals.filter((j) => ['CASH', 'BANK'].includes(j.type)).length;
  const generalCount = journals.filter((j) => j.type === 'GENERAL').length;

  return (
    <ErpLayout title="Journals" subtitle="Accounting Books & Classification Ledgers">
      {/* Top Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Journals</h2>
          <p className="subtitle">Master books for classifying commercial transactions, cash disbursements, and bank settlements</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>+</span> Add Journal
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      {/* KPI Cards */}
      <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card">
          <div className="kpi-icon-box green">📚</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Books</span>
            <span className="kpi-val" style={{ color: 'var(--text-primary)' }}>{journals.length}</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box blue">🛍️</div>
          <div className="kpi-details">
            <span className="kpi-label">Sales Journals</span>
            <span className="kpi-val" style={{ color: 'var(--accent)' }}>{salesCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box amber">📦</div>
          <div className="kpi-details">
            <span className="kpi-label">Purchase Journals</span>
            <span className="kpi-val" style={{ color: '#e67e22' }}>{purchaseCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box gold">🏦</div>
          <div className="kpi-details">
            <span className="kpi-label">Cash & Bank Journals</span>
            <span className="kpi-val" style={{ color: 'var(--accent-gold)' }}>{cashBankCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['ALL', 'SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            {type === 'ALL' ? 'All Journals' : `${type.charAt(0) + type.slice(1).toLowerCase()} Journals`}
          </button>
        ))}
      </div>

      {/* Journals Table */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Active Master Books ({filteredJournals.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading journals...
            </div>
          ) : filteredJournals.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">📚</div>
              <h3>No journals found</h3>
              <p>Click "+ Add Journal" to register a new accounting book.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Code</th>
                  <th>Journal Name</th>
                  <th style={{ width: '140px' }}>Type</th>
                  <th>Default Account</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Internal Entries</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournals.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{j.code}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{j.name}</strong>
                    </td>
                    <td>{getJournalTypeBadge(j.type)}</td>
                    <td>
                      {j.defaultAccount ? (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'var(--accent)' }}>{j.defaultAccount.code}</strong> — {j.defaultAccount.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-admin" style={{ fontSize: '0.78rem' }}>
                        {j._count?.journalEntries ?? 0} entries
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-active">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Journal Modal */}
      {showModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Create New Accounting Journal</h3>
                <p className="modal-subtitle">Define an operational book for transaction classification</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}

            <form onSubmit={handleCreateJournal}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SJ"
                    required
                    maxLength={10}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Journal Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Customer Sales Book"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Journal Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-input"
                    style={{ height: '48px' }}
                    required
                  >
                    <option value="SALES">Sales Journal</option>
                    <option value="PURCHASE">Purchase Journal</option>
                    <option value="BANK">Bank Journal</option>
                    <option value="CASH">Cash Journal</option>
                    <option value="GENERAL">General Journal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Clearing Account</label>
                  <select
                    value={formData.defaultAccountId}
                    onChange={(e) => setFormData({ ...formData, defaultAccountId: e.target.value })}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="">-- Select Account (Optional) --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : 'Create Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default JournalsPage;
