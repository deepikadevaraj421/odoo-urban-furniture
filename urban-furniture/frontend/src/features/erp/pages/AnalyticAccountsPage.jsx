import { useState, useEffect, useMemo, useRef } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// Helper icon picker based on account code or name
const getAccountIcon = (code, name) => {
  const text = `${code} ${name}`.toLowerCase();
  if (text.includes('sale') || text.includes('retail') || text.includes('channel')) return '🛍️';
  if (text.includes('purchase') || text.includes('procurement')) return '📦';
  if (text.includes('manufactur') || text.includes('production')) return '🏭';
  if (text.includes('showroom') || text.includes('branch') || text.includes('chennai') || text.includes('bangalore') || text.includes('coimbatore')) return '🏢';
  if (text.includes('market') || text.includes('campaign')) return '📢';
  if (text.includes('admin') || text.includes('corporate') || text.includes('legal')) return '🏛️';
  if (text.includes('warehous') || text.includes('logistics') || text.includes('fleet')) return '🚚';
  if (text.includes('export') || text.includes('overseas')) return '🌐';
  if (text.includes('research') || text.includes('r&d') || text.includes('design')) return '🔬';
  if (text.includes('service') || text.includes('support') || text.includes('customer')) return '🎧';
  return '📊';
};

// SVG Donut Chart Component
const AnalyticDonutChart = ({ incomeCount, expensesCount }) => {
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = incomeCount + expensesCount;
  const incomePercent = total > 0 ? incomeCount / total : 0;
  const expensesPercent = total > 0 ? expensesCount / total : 0;

  const incomeDash = `${incomePercent * circumference} ${circumference}`;
  const expensesDash = `${expensesPercent * circumference} ${circumference}`;
  const expensesOffset = -(incomePercent * circumference);

  return (
    <div className="aa-donut-layout">
      <div className="aa-donut-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />
          {total > 0 && (
            <>
              {/* Income slice (Green) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#059669"
                strokeWidth={strokeWidth}
                strokeDasharray={incomeDash}
                strokeDashoffset={0}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              {/* Expenses slice (Orange/Amber) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#ea580c"
                strokeWidth={strokeWidth}
                strokeDasharray={expensesDash}
                strokeDashoffset={expensesOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
              />
            </>
          )}
        </svg>
        <div className="aa-donut-center">
          <span className="aa-donut-total">{total}</span>
          <span className="aa-donut-sub">Accounts</span>
        </div>
      </div>

      <div className="aa-legend">
        <div className="aa-legend-item">
          <div className="aa-legend-left">
            <span className="aa-legend-dot" style={{ backgroundColor: '#059669' }} />
            <span>Income</span>
          </div>
          <div className="aa-legend-right">
            <span>{incomeCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({total > 0 ? Math.round((incomeCount / total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="aa-legend-item">
          <div className="aa-legend-left">
            <span className="aa-legend-dot" style={{ backgroundColor: '#ea580c' }} />
            <span>Expenses</span>
          </div>
          <div className="aa-legend-right">
            <span>{expensesCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({total > 0 ? Math.round((expensesCount / total) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // KPIs
  const [kpis, setKpis] = useState({
    total: 0,
    income: 0,
    expenses: 0,
    linkedBudgets: 0,
  });

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: 'ALL',
    status: 'ALL',
  });

  // Action Menu State (which card's 3-dot dropdown is open)
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'Income',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.aa-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch real accounts from database
  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.type !== 'ALL') params.type = appliedFilters.type;
      if (appliedFilters.status !== 'ALL') params.status = appliedFilters.status;

      const res = await erpApi.getAnalyticAccounts(params);
      setAccounts(res.data.accounts || []);
      if (res.data.kpis) {
        setKpis(res.data.kpis);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytic accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [appliedFilters]);

  // Search & Filter handlers
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      search: searchInput.trim(),
      type: typeFilter,
      status: statusFilter,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setAppliedFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const nextCode = `AN${String(kpis.total + 1).padStart(2, '0')}`;
    setFormData({
      code: nextCode,
      name: '',
      description: '',
      type: 'Income',
      status: 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc) => {
    setEditingAccount(acc);
    setFormData({
      code: acc.code || '',
      name: acc.name || '',
      description: acc.description || '',
      type: acc.type || 'Income',
      status: acc.status || 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setOpenMenuId(null);
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError('Code and Name are required fields.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (editingAccount) {
        await erpApi.updateAnalyticAccount(editingAccount.id, formData);
        setFormSuccess('Analytic account updated successfully!');
      } else {
        await erpApi.createAnalyticAccount(formData);
        setFormSuccess('Analytic account created successfully!');
      }

      fetchAccounts();
      setTimeout(() => {
        setShowCreateModal(false);
        setEditingAccount(null);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save analytic account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (acc) => {
    const nextStatus = acc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await erpApi.updateAnalyticAccount(acc.id, { status: nextStatus });
      setOpenMenuId(null);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    try {
      const res = await erpApi.deleteAnalyticAccount(deletingAccount.id);
      if (res.data.deactivated) {
        alert(res.data.message);
      }
      setDeletingAccount(null);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete analytic account.');
    }
  };

  return (
    <ErpLayout title="Analytic Accounts" subtitle="Cost Centers & Operational Dimensions">
      <div className="aa-page-container">
        {/* ============================================================
            1. PAGE HEADER (CLEAN, NO TOP HERO/DECORATIVE IMAGE)
            ============================================================ */}
        <div className="aa-header-row">
          <div className="aa-header-left">
            <h2>Analytic Accounts</h2>
            <p>Track and analyze income & expenses by business area, branch or project</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="aa-create-btn"
          >
            <span>+</span> Create Analytic Account
          </button>
        </div>

        {error && <div className="alert alert-error mb-2">{error}</div>}

        {/* ============================================================
            2. 4 KPI CARDS (DATABASE DRIVEN)
            ============================================================ */}
        <div className="aa-kpi-grid">
          {/* Total Analytic Accounts */}
          <div className="aa-kpi-card">
            <div className="aa-kpi-icon total">📊</div>
            <div className="aa-kpi-details">
              <span className="aa-kpi-label">Total Analytic Accounts</span>
              <span className="aa-kpi-val">{kpis.total}</span>
            </div>
          </div>

          {/* Income Type */}
          <div className="aa-kpi-card">
            <div className="aa-kpi-icon income">📈</div>
            <div className="aa-kpi-details">
              <span className="aa-kpi-label">Income Type</span>
              <span className="aa-kpi-val">{kpis.income}</span>
            </div>
          </div>

          {/* Expense Type */}
          <div className="aa-kpi-card">
            <div className="aa-kpi-icon expense">📉</div>
            <div className="aa-kpi-details">
              <span className="aa-kpi-label">Expense Type</span>
              <span className="aa-kpi-val">{kpis.expenses}</span>
            </div>
          </div>

          {/* Linked Budgets */}
          <div className="aa-kpi-card">
            <div className="aa-kpi-icon budget">🎯</div>
            <div className="aa-kpi-details">
              <span className="aa-kpi-label">Linked Budgets</span>
              <span className="aa-kpi-val">{kpis.linkedBudgets}</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. ANALYTIC ACCOUNT ANALYSIS (DONUT CHART & INFO CARD)
            ============================================================ */}
        <div className="aa-analytics-grid">
          {/* Left: Donut / Pie Chart */}
          <div className="aa-analytics-card">
            <h3 className="aa-card-heading">📊 Analytic Accounts by Type</h3>
            <p className="aa-card-subheading">Breakdown across income-generating centers and cost allocations</p>
            <AnalyticDonutChart
              incomeCount={kpis.income}
              expensesCount={kpis.expenses}
            />
          </div>

          {/* Right: Why use Analytic Accounts? Info Card */}
          <div className="aa-analytics-card">
            <h3 className="aa-card-heading">💡 Why use Analytic Accounts?</h3>
            <p className="aa-card-subheading">Operational dimension tracking for multi-unit enterprises</p>

            <div className="aa-info-content">
              <p className="aa-info-lead">
                "Group and monitor income or expenses by department, branch or project for better decision making."
              </p>

              <ul className="aa-feature-list">
                <li className="aa-feature-item">
                  <span className="aa-feature-bullet">✓</span>
                  <span><strong>Multi-dimensional Analysis:</strong> Tag transactions by cost center without inflating your financial Chart of Accounts.</span>
                </li>
                <li className="aa-feature-item">
                  <span className="aa-feature-bullet">✓</span>
                  <span><strong>Operating Budgets Connection:</strong> Assign spending allowances to departments and track variances against actual amounts.</span>
                </li>
                <li className="aa-feature-item">
                  <span className="aa-feature-bullet">✓</span>
                  <span><strong>Branch & Project Profitability:</strong> Compare showroom performance (Chennai vs Bangalore) and project ROI accurately.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================
            4. SEARCH + FILTER TOOLBAR
            ============================================================ */}
        <form onSubmit={handleSearchSubmit} className="aa-toolbar">
          <div className="aa-search-box">
            <span className="aa-search-icon">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by code, name or description..."
              className="aa-search-input"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="aa-select"
          >
            <option value="ALL">All Types</option>
            <option value="Income">Income</option>
            <option value="Expenses">Expenses</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="aa-select"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: '42px', padding: '0 20px', background: '#065f46' }}
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="aa-reset-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Reset
          </button>
        </form>

        {/* ============================================================
            5. ANALYTIC ACCOUNT DISPLAY (4-CARD GRID ON DESKTOP)
            ============================================================ */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading analytic accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state" style={{ margin: '40px auto' }}>
            <div className="empty-state-icon">📈</div>
            <h3>No analytic accounts found</h3>
            <p>Try adjusting your search criteria or click "+ Create Analytic Account".</p>
          </div>
        ) : (
          <div className="aa-card-grid">
            {accounts.map((acc) => {
              const icon = getAccountIcon(acc.code, acc.name);
              const budgetCount = acc._count?.budgets ?? acc.budgets?.length ?? 0;
              const isIncome = (acc.type || '').toLowerCase().includes('inc');
              const isActive = (acc.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

              return (
                <div
                  key={acc.id}
                  className={`aa-card ${!isActive ? 'inactive' : ''}`}
                >
                  {/* Card Header: Icon + Code + 3-Dot Menu */}
                  <div className="aa-card-header">
                    <div className="aa-card-header-left">
                      <div className="aa-card-icon">{icon}</div>
                      <span className="aa-code-badge">{acc.code}</span>
                    </div>

                    <div className="aa-menu-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === acc.id ? null : acc.id);
                        }}
                        className="aa-menu-btn"
                        title="More Actions"
                      >
                        ⋮
                      </button>

                      {openMenuId === acc.id && (
                        <div className="aa-dropdown-menu">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingAccount(acc);
                              setOpenMenuId(null);
                            }}
                            className="aa-dropdown-item"
                          >
                            👁️ View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(acc)}
                            className="aa-dropdown-item"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            className="aa-dropdown-item"
                          >
                            {isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingAccount(acc);
                              setOpenMenuId(null);
                            }}
                            className="aa-dropdown-item danger"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <h4 className="aa-card-title">{acc.name}</h4>
                  <p className="aa-card-desc">
                    {acc.description || 'General operational dimension tracking income and expenditures.'}
                  </p>

                  {/* Card Footer: Type Badge + Linked Budgets + Status */}
                  <div className="aa-card-meta">
                    <span className={`aa-type-badge ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? 'INCOME' : 'EXPENSES'}
                    </span>

                    <span className="aa-budget-count" title="Connected Operating Budgets">
                      🎯 {budgetCount} {budgetCount === 1 ? 'Budget' : 'Budgets'}
                    </span>

                    <span className={`aa-status-dot ${isActive ? 'active' : 'inactive'}`}>
                      ● {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================
            MODAL 1: VIEW ACCOUNT DETAILS MODAL
            ============================================================ */}
        {viewingAccount && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(640px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}>{viewingAccount.name}</h3>
                    <span className="aa-code-badge">{viewingAccount.code}</span>
                  </div>
                  <p className="modal-subtitle">Analytic tracking dimension profile & budget links</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingAccount(null)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '10px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</label>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewingAccount.type}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                    <span style={{ fontWeight: 600, color: viewingAccount.status === 'ACTIVE' ? '#059669' : 'var(--text-muted)' }}>
                      ● {viewingAccount.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Linked Budgets</label>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {viewingAccount._count?.budgets ?? viewingAccount.budgets?.length ?? 0}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Description
                  </label>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {viewingAccount.description || 'No detailed description specified for this analytic dimension.'}
                  </p>
                </div>

                {viewingAccount.budgets && viewingAccount.budgets.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Connected Budgets ({viewingAccount.budgets.length})
                    </label>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px' }}>Budget Name</th>
                            <th style={{ padding: '8px 12px' }}>Period</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Planned (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingAccount.budgets.map((b) => (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.name}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{b.period}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#065f46' }}>
                                {formatCurrency(Number(b.plannedAmount || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const acc = viewingAccount;
                    setViewingAccount(null);
                    handleOpenEditModal(acc);
                  }}
                  className="btn btn-secondary"
                >
                  ✏️ Edit Account
                </button>
                <button
                  type="button"
                  onClick={() => setViewingAccount(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 2: CREATE / EDIT ANALYTIC ACCOUNT MODAL
            ============================================================ */}
        {(showCreateModal || editingAccount) && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(560px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <div>
                  <h3>{editingAccount ? 'Edit Analytic Account' : 'Create Analytic Account'}</h3>
                  <p className="modal-subtitle">Define an operational tracking dimension</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAccount(null);
                  }}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              {formError && <div className="alert alert-error mb-4">{formError}</div>}
              {formSuccess && <div className="alert alert-success mb-4">{formSuccess}</div>}

              <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Analytic Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. AN01"
                      className="form-input"
                      style={{ height: '42px', textTransform: 'uppercase' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sales Department"
                      className="form-input"
                      style={{ height: '42px' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Sales and customer related activities"
                    className="form-input"
                    style={{ padding: '10px 12px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="form-input"
                      style={{ height: '42px' }}
                      required
                    >
                      <option value="Income">Income</option>
                      <option value="Expenses">Expenses</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-input"
                      style={{ height: '42px' }}
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAccount(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ background: '#065f46' }}
                  >
                    {submitting
                      ? 'Saving...'
                      : editingAccount
                      ? 'Save Changes'
                      : 'Create Analytic Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 3: DELETE CONFIRMATION MODAL
            ============================================================ */}
        {deletingAccount && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(480px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <h3>Delete Analytic Account</h3>
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p>
                  Are you sure you want to remove analytic account{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{deletingAccount.name} ({deletingAccount.code})</strong>?
                </p>
                {(deletingAccount._count?.budgets > 0 || deletingAccount.budgets?.length > 0) && (
                  <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                    ⚠️ This account has <strong>{deletingAccount._count?.budgets || deletingAccount.budgets?.length} linked budget(s)</strong>. To preserve historical budget reports, it will be safely <strong>deactivated</strong> instead of permanently removed.
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn btn-danger"
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Confirm Delete / Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErpLayout>
  );
};

export default AnalyticAccountsPage;

