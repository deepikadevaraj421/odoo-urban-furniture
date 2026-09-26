import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'CARDS'

  const [formData, setFormData] = useState({
    name: '',
    period: '2026',
    plannedAmount: '',
    responsible: '',
    analyticAccountId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        erpApi.getBudgets(),
        erpApi.getAnalyticAccounts(),
      ]);
      setBudgets(bRes.data.budgets || []);
      setAnalytics(aRes.data.accounts || []);
      if (aRes.data.accounts?.length > 0 && !formData.analyticAccountId) {
        setFormData((prev) => ({ ...prev, analyticAccountId: aRes.data.accounts[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await erpApi.createBudget(formData);
      setActionSuccess('Budget created successfully in database!');
      setFormData({
        name: '',
        period: '2026',
        plannedAmount: '',
        responsible: '',
        analyticAccountId: analytics[0]?.id || '',
      });
      setShowModal(false);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create budget.');
    } finally {
      setSubmitting(false);
    }
  };

  // Real Database Totals
  const totalBudgetsCount = budgets.length;
  const totalPlanned = budgets.reduce((sum, b) => sum + (b.plannedAmount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
  const totalVariance = totalPlanned - totalActual;

  return (
    <ErpLayout title="Budgets" subtitle="Budget Planning Dashboard & Variance Analysis">
      {/* Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Budgets</h2>
          <p className="subtitle">Budget planning dashboard connected to analytic operational dimensions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: viewMode === 'TABLE' ? 'var(--accent)' : 'var(--bg-card)',
                color: viewMode === 'TABLE' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: viewMode === 'CARDS' ? 'var(--accent)' : 'var(--bg-card)',
                color: viewMode === 'CARDS' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              Card View
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Create Budget
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      {/* Top 4 Budget Dashboard KPI Cards (Mandatory from Database) */}
      <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
          <div className="kpi-icon-box blue">🎯</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Budgets</span>
            <span className="kpi-val" style={{ color: 'var(--text-primary)' }}>{totalBudgetsCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="kpi-icon-box gold">📋</div>
          <div className="kpi-details">
            <span className="kpi-label">Planned Amount</span>
            <span className="kpi-val" style={{ color: 'var(--accent)' }}>{formatCurrency(totalPlanned)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
          <div className="kpi-icon-box amber">⚡</div>
          <div className="kpi-details">
            <span className="kpi-label">Actual Amount</span>
            <span className="kpi-val" style={{ color: '#f57c00' }}>
              {totalActual > 0 ? formatCurrency(totalActual) : "₹0.00"}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
          <div className="kpi-icon-box green">📊</div>
          <div className="kpi-details">
            <span className="kpi-label">Overall Variance</span>
            <span className="kpi-val" style={{ color: totalVariance >= 0 ? '#2e7d32' : '#c0392b' }}>
              {formatCurrency(totalVariance)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Budget Planning Dashboard View */}
      {viewMode === 'CARDS' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {budgets.map((b) => {
            const hasActual = b.actualAmount && b.actualAmount > 0;
            const pct = b.plannedAmount > 0 ? Math.min(100, Math.round(((b.actualAmount || 0) / b.plannedAmount) * 100)) : 0;
            return (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid var(--accent)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{b.name}</h4>
                    <span className="badge badge-active">{b.period}</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Analytic: <strong style={{ color: 'var(--text-secondary)' }}>{b.analyticAccount?.name || 'General'}</strong>
                    {b.responsible && <> | Lead: {b.responsible}</>}
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Planned:</span>
                      <strong>{formatCurrency(b.plannedAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Actual:</span>
                      <strong style={{ color: hasActual ? '#f57c00' : 'var(--text-muted)' }}>
                        {hasActual ? formatCurrency(b.actualAmount) : "No actual data yet"}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, paddingTop: '4px', borderTop: '1px dashed var(--border)' }}>
                      <span>Variance:</span>
                      <span style={{ color: (b.variance || 0) >= 0 ? '#2e7d32' : '#c0392b' }}>
                        {hasActual ? formatCurrency(b.variance) : formatCurrency(b.plannedAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Budget Utilized</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#c0392b' : 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="erp-card-table">
          <div className="erp-table-header">
            <h3>Planned Budgets & Allocations ({budgets.length})</h3>
          </div>
          <div className="erp-table-scroll">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading budgets...
              </div>
            ) : budgets.length === 0 ? (
              <div className="empty-state" style={{ margin: '40px auto' }}>
                <div className="empty-state-icon">🎯</div>
                <h3>No budgets planned</h3>
                <p>Click "+ Create Budget" to set financial targets.</p>
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Budget Name</th>
                    <th style={{ width: '100px' }}>Period</th>
                    <th>Analytic Dimension</th>
                    <th>Responsible Person</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Planned Amount</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Actual Amount</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Variance</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => {
                    const hasActual = b.actualAmount && b.actualAmount > 0;
                    return (
                      <tr key={b.id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                        </td>
                        <td>
                          <span className="badge badge-admin">{b.period}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {b.analyticAccount ? (
                              <><strong style={{ color: 'var(--accent)' }}>{b.analyticAccount.code}</strong> — {b.analyticAccount.name}</>
                            ) : (
                              'General'
                            )}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{b.responsible || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(b.plannedAmount)}
                        </td>
                        <td style={{ textAlign: 'right', color: hasActual ? '#f57c00' : 'var(--text-muted)' }}>
                          {hasActual ? formatCurrency(b.actualAmount) : <span style={{ fontSize: "0.78rem", fontStyle: "italic" }}>No actual data yet</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: (b.variance || 0) >= 0 ? '#2e7d32' : '#c0392b' }}>
                          {formatCurrency(b.variance !== undefined ? b.variance : b.plannedAmount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-active">{b.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Create New Budget</h3>
                <p className="modal-subtitle">Set planned expenditure limits linked to analytic accounts</p>
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

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Budget Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Annual Marketing & Showroom Budget"
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Period *</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="e.g. 2026 or Q1 2026"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Planned Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.plannedAmount}
                    onChange={(e) => setFormData({ ...formData, plannedAmount: e.target.value })}
                    placeholder="500000"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Analytic Account (Existing Master)</label>
                  <select
                    value={formData.analyticAccountId}
                    onChange={(e) => setFormData({ ...formData, analyticAccountId: e.target.value })}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="">-- Select Analytic Account --</option>
                    {analytics.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Responsible Person</label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="e.g. Finance Lead"
                    className="form-input"
                  />
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
                  {submitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default BudgetsPage;

