import { useState, useEffect, useMemo, useRef } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// Type colors for badges and charts
const TYPE_CONFIG = {
  ASSET: { label: 'Asset', color: '#2e7d32', badgeClass: 'badge-active' },
  LIABILITY: { label: 'Liability', color: '#d97706', badgeClass: 'badge-warning' },
  EXPENSE: { label: 'Expense', color: '#c62828', badgeClass: 'badge-inactive' },
  INCOME: { label: 'Income', color: '#2563eb', badgeClass: 'badge-admin' },
  CAPITAL: { label: 'Capital', color: '#8b5cf6', badgeClass: 'badge-sales' },
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: '#2e7d32', badgeClass: 'badge-active' },
  INACTIVE: { label: 'Inactive', color: '#c62828', badgeClass: 'badge-inactive' },
};

// SVG Donut Chart Component
const DonutChart = ({ data, total, centerText, centerSub }) => {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="coa-donut-wrapper">
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
        {total > 0 &&
          data.map((slice, index) => {
            if (slice.value <= 0) return null;
            const percent = slice.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            return (
              <circle
                key={slice.key || index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
              />
            );
          })}
      </svg>
      <div className="coa-donut-center">
        <span className="coa-donut-total">{centerText}</span>
        <span className="coa-donut-sub">{centerSub}</span>
      </div>
    </div>
  );
};

const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter inputs
  const [searchInput, setSearchInput] = useState('');
  const [typeInput, setTypeInput] = useState('ALL');
  const [statusInput, setStatusInput] = useState('ALL');

  // Applied filters (triggered by Search/Filter buttons)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: 'ALL',
    status: 'ALL',
  });

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states for Add
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    description: '',
    status: 'ACTIVE',
    balance: '0',
  });

  // Form states for Edit
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    description: '',
    status: 'ACTIVE',
    balance: '0',
  });

  // Import states
  const fileInputRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Fetch accounts from backend
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.type !== 'ALL') params.type = appliedFilters.type;
      if (appliedFilters.status !== 'ALL') params.status = appliedFilters.status;
      if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();

      const res = await erpApi.getAccounts(params);
      setAccounts(res.data.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chart of accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchAccounts();
  }, [appliedFilters]);

  // Apply search & filter handlers
  const handleApplyFilter = (e) => {
    e?.preventDefault();
    setAppliedFilters({
      search: searchInput,
      type: typeInput,
      status: statusInput,
    });
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setTypeInput('ALL');
    setStatusInput('ALL');
    setAppliedFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
    });
  };

  // Real KPI statistics derived from PostgreSQL accounts
  const kpiStats = useMemo(() => {
    const total = accounts.length;
    const assets = accounts.filter((a) => a.type === 'ASSET').length;
    const liabilities = accounts.filter((a) => a.type === 'LIABILITY').length;
    const expenses = accounts.filter((a) => a.type === 'EXPENSE').length;
    const income = accounts.filter((a) => a.type === 'INCOME').length;
    const capital = accounts.filter((a) => a.type === 'CAPITAL').length;
    const active = accounts.filter((a) => (a.status || 'ACTIVE') === 'ACTIVE').length;
    const inactive = accounts.filter((a) => a.status === 'INACTIVE').length;

    return { total, assets, liabilities, expenses, income, capital, active, inactive };
  }, [accounts]);

  // Real Donut Chart Data 1: Accounts by Type
  const typeChartData = useMemo(() => {
    return [
      { key: 'ASSET', label: 'Assets', value: kpiStats.assets, color: TYPE_CONFIG.ASSET.color },
      { key: 'LIABILITY', label: 'Liabilities', value: kpiStats.liabilities, color: TYPE_CONFIG.LIABILITY.color },
      { key: 'EXPENSE', label: 'Expenses', value: kpiStats.expenses, color: TYPE_CONFIG.EXPENSE.color },
      { key: 'INCOME', label: 'Income', value: kpiStats.income, color: TYPE_CONFIG.INCOME.color },
      { key: 'CAPITAL', label: 'Capital', value: kpiStats.capital, color: TYPE_CONFIG.CAPITAL.color },
    ];
  }, [kpiStats]);

  // Real Donut Chart Data 2: Active vs Inactive
  const statusChartData = useMemo(() => {
    return [
      { key: 'ACTIVE', label: 'Active', value: kpiStats.active, color: STATUS_CONFIG.ACTIVE.color },
      { key: 'INACTIVE', label: 'Inactive', value: kpiStats.inactive, color: STATUS_CONFIG.INACTIVE.color },
    ];
  }, [kpiStats]);

  // Client-side pagination calculations
  const totalRecords = accounts.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedAccounts = useMemo(() => {
    return accounts.slice(startIndex, endIndex);
  }, [accounts, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Add Account handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.createAccount(formData);
      setModalSuccess('Account added to Chart of Accounts!');
      setFormData({
        code: '',
        name: '',
        type: 'ASSET',
        description: '',
        status: 'ACTIVE',
        balance: '0',
      });
      fetchAccounts();
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Account handlers
  const openEditModal = (account) => {
    setEditingAccount(account);
    setEditFormData({
      code: account.code || '',
      name: account.name || '',
      type: account.type || 'ASSET',
      description: account.description || '',
      status: account.status || 'ACTIVE',
      balance: account.balance ?? '0',
    });
    setModalError('');
    setModalSuccess('');
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.updateAccount(editingAccount.id, editFormData);
      setModalSuccess('Account updated successfully!');
      fetchAccounts();
      setTimeout(() => {
        setEditingAccount(null);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Archive Account handlers
  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setSubmitting(true);
    try {
      await erpApi.deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveAccount = async (account) => {
    try {
      await erpApi.updateAccount(account.id, { status: 'INACTIVE' });
      setDeletingAccount(null);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive account.');
    }
  };

  // CSV Import Logic
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportError('');
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        parseCSVText(text);
      } catch (err) {
        setImportError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setImportError('CSV file must contain a header row and at least one data row.');
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const validTypes = ['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'CAPITAL'];

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      // Basic CSV splitter respecting quoted strings
      const values = [];
      let inQuote = false;
      let curVal = '';
      for (const char of lines[i]) {
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      const name = rowObj['Account Name'] || rowObj['name'] || values[0] || '';
      const type = (rowObj['Type'] || rowObj['type'] || values[1] || '').toUpperCase();
      const code = rowObj['Code'] || rowObj['code'] || values[2] || '';
      const description = rowObj['Description'] || rowObj['description'] || values[3] || '';
      const status = (rowObj['Status'] || rowObj['status'] || values[4] || 'ACTIVE').toUpperCase();

      // Validation
      const errors = [];
      if (!name) errors.push('Missing Account Name');
      if (!code) errors.push('Missing Code');
      if (!validTypes.includes(type)) {
        errors.push(`Invalid Type (${type || 'empty'}). Must be ASSET, LIABILITY, EXPENSE, INCOME, CAPITAL`);
      }

      rows.push({
        rowNumber: i,
        name,
        type,
        code,
        description,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError('No valid rows available to import.');
      return;
    }

    setImportSubmitting(true);
    setImportError('');
    try {
      const payload = {
        accounts: validRows.map((r) => ({
          name: r.name,
          type: r.type,
          code: r.code,
          description: r.description,
          status: r.status,
        })),
      };

      const res = await erpApi.importAccounts(payload);
      setImportSummary(res.data.summary);
      fetchAccounts();
      setTimeout(() => {
        setShowImportModal(false);
        setCsvFile(null);
        setParsedRows([]);
        setImportSummary(null);
      }, 2000);
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to import accounts to PostgreSQL.');
    } finally {
      setImportSubmitting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'Account Name,Type,Code,Description,Status\n' +
      'Cash,ASSET,1000,Cash in hand,ACTIVE\n' +
      'Bank,ASSET,1010,Bank account balance,ACTIVE\n' +
      'Accounts Receivable,ASSET,1100,Amount receivable from customers,ACTIVE\n' +
      'Accounts Payable,LIABILITY,2000,Amount payable to vendors,ACTIVE\n' +
      'Sales Income,INCOME,4000,Income from furniture sales,ACTIVE\n' +
      'Purchase Expense,EXPENSE,5000,Cost of goods purchased,ACTIVE\n' +
      'Owner Capital,CAPITAL,3000,Owner investment in business,ACTIVE\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_chart_of_accounts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ErpLayout title="Chart of Accounts" subtitle="General Ledger Master Structure">
      {/* 1. Clean Top Header Row (NO decorative hero banner) */}
      <div className="master-header-row">
        <div>
          <div className="master-breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span>Accounting</span>
            <span>&gt;</span>
            <span className="crumb-active">Chart of Accounts</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Chart of Accounts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Manage and classify all financial accounts for accurate accounting and reporting
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add New Account
        </button>
      </div>

      {/* 2. Real KPI Cards from Database */}
      <div className="coa-kpi-grid">
        <div className="coa-kpi-card" style={{ '--kpi-color': 'var(--accent)' }}>
          <span className="coa-kpi-label">Total Accounts</span>
          <span className="coa-kpi-value">{kpiStats.total}</span>
        </div>
        <div className="coa-kpi-card" style={{ '--kpi-color': TYPE_CONFIG.ASSET.color }}>
          <span className="coa-kpi-label">Assets</span>
          <span className="coa-kpi-value" style={{ color: TYPE_CONFIG.ASSET.color }}>
            {kpiStats.assets}
          </span>
        </div>
        <div className="coa-kpi-card" style={{ '--kpi-color': TYPE_CONFIG.LIABILITY.color }}>
          <span className="coa-kpi-label">Liabilities</span>
          <span className="coa-kpi-value" style={{ color: TYPE_CONFIG.LIABILITY.color }}>
            {kpiStats.liabilities}
          </span>
        </div>
        <div className="coa-kpi-card" style={{ '--kpi-color': TYPE_CONFIG.EXPENSE.color }}>
          <span className="coa-kpi-label">Expenses</span>
          <span className="coa-kpi-value" style={{ color: TYPE_CONFIG.EXPENSE.color }}>
            {kpiStats.expenses}
          </span>
        </div>
        <div className="coa-kpi-card" style={{ '--kpi-color': TYPE_CONFIG.INCOME.color }}>
          <span className="coa-kpi-label">Income</span>
          <span className="coa-kpi-value" style={{ color: TYPE_CONFIG.INCOME.color }}>
            {kpiStats.income}
          </span>
        </div>
        <div className="coa-kpi-card" style={{ '--kpi-color': TYPE_CONFIG.CAPITAL.color }}>
          <span className="coa-kpi-label">Capital</span>
          <span className="coa-kpi-value" style={{ color: TYPE_CONFIG.CAPITAL.color }}>
            {kpiStats.capital}
          </span>
        </div>
      </div>

      {/* 3. Real Pie/Donut Chart Analysis Section */}
      <div className="coa-charts-grid">
        {/* Chart 1: Accounts by Type */}
        <div className="coa-chart-card">
          <div className="coa-chart-header">
            <div>
              <h3 className="coa-chart-title">📊 Accounts by Type</h3>
              <p className="coa-chart-subtitle">Distribution across 5 standard accounting classifications</p>
            </div>
          </div>
          <div className="coa-chart-body">
            <DonutChart
              data={typeChartData}
              total={kpiStats.total}
              centerText={kpiStats.total}
              centerSub="Accounts"
            />
            <div className="coa-legend">
              {typeChartData.map((item) => {
                const percent = kpiStats.total > 0 ? Math.round((item.value / kpiStats.total) * 100) : 0;
                return (
                  <div key={item.key} className="coa-legend-item">
                    <div className="coa-legend-item-left">
                      <span className="coa-legend-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <div className="coa-legend-item-right">
                      <span>{item.value}</span>
                      <span className="coa-legend-percent">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Active vs Inactive Accounts */}
        <div className="coa-chart-card">
          <div className="coa-chart-header">
            <div>
              <h3 className="coa-chart-title">⚡ Active vs Inactive Accounts</h3>
              <p className="coa-chart-subtitle">Operating vs archived ledger status</p>
            </div>
          </div>
          <div className="coa-chart-body">
            <DonutChart
              data={statusChartData}
              total={kpiStats.total}
              centerText={kpiStats.total > 0 ? `${Math.round((kpiStats.active / kpiStats.total) * 100)}%` : '0%'}
              centerSub="Active"
            />
            <div className="coa-legend">
              {statusChartData.map((item) => {
                const percent = kpiStats.total > 0 ? Math.round((item.value / kpiStats.total) * 100) : 0;
                return (
                  <div key={item.key} className="coa-legend-item">
                    <div className="coa-legend-item-left">
                      <span className="coa-legend-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <div className="coa-legend-item-right">
                      <span>{item.value}</span>
                      <span className="coa-legend-percent">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Toolbar: [ Search ] [ Types ] [ Status ] [ Search ] [ Filter ] [ Import ] [ Reset ] */}
      <form onSubmit={handleApplyFilter} className="coa-toolbar">
        <div className="coa-toolbar-search">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search accounts by Name, Code, Description..."
            className="form-input search-field"
            style={{ height: '44px' }}
          />
        </div>

        <select
          value={typeInput}
          onChange={(e) => setTypeInput(e.target.value)}
          className="coa-toolbar-select"
        >
          <option value="ALL">All Types</option>
          <option value="ASSET">ASSET</option>
          <option value="LIABILITY">LIABILITY</option>
          <option value="EXPENSE">EXPENSE</option>
          <option value="INCOME">INCOME</option>
          <option value="CAPITAL">CAPITAL</option>
        </select>

        <select
          value={statusInput}
          onChange={(e) => setStatusInput(e.target.value)}
          className="coa-toolbar-select"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <div className="coa-btn-group">
          <button type="submit" className="btn btn-primary" style={{ height: '44px', padding: '0 16px' }}>
            🔍 Search
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="btn btn-secondary"
            style={{ height: '44px', padding: '0 16px' }}
          >
            ⚡ Filter
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="btn-import"
            title="Import Chart of Accounts from CSV"
          >
            📥 Import
          </button>
          <button
            type="button"
            onClick={handleResetFilter}
            className="btn btn-secondary"
            style={{ height: '44px', padding: '0 14px' }}
            title="Reset Search and Filters"
          >
            ↺ Reset
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* 5. Master Accounts Table */}
      <div className="master-table-card">
        <div className="master-toolbar">
          <div className="master-records-count">
            <span>Chart of Accounts</span>
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

        <div style={{ width: '100%', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading accounts from PostgreSQL database...
            </div>
          ) : totalRecords === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">📑</div>
              <h3>No accounts match the criteria</h3>
              <p>Try clearing filters or click "+ Add New Account" / "Import" to add records.</p>
            </div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '200px' }}>Account Name</th>
                  <th style={{ minWidth: '120px' }}>Type</th>
                  <th style={{ minWidth: '100px' }}>Code</th>
                  <th style={{ minWidth: '220px' }}>Description</th>
                  <th style={{ minWidth: '95px' }}>Status</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccounts.map((a, index) => {
                  const rowNumber = startIndex + index + 1;
                  const typeCfg = TYPE_CONFIG[a.type] || { badgeClass: 'badge-admin', color: 'inherit' };
                  const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.ACTIVE;

                  return (
                    <tr key={a.id}>
                      <td className="table-index-cell" style={{ textAlign: 'center' }}>
                        {rowNumber}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{a.name}</strong>
                      </td>
                      <td>
                        <span className={`badge ${typeCfg.badgeClass}`}>
                          {a.type}
                        </span>
                      </td>
                      <td>
                        <span className="customer-code">{a.code}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '240px' }}>
                        <span
                          title={a.description || ''}
                          style={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {a.description || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusCfg.badgeClass}`}>
                          {a.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="View Account Details"
                            onClick={() => setViewingAccount(a)}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="Edit Account"
                            onClick={() => openEditModal(a)}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon btn-delete"
                            title="Delete / Archive Account"
                            onClick={() => setDeletingAccount(a)}
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

        {/* Pagination Bar */}
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
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
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

      {/* ── Add Account Modal ────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Add Account</h3>
                <p className="modal-subtitle">Define an account in PostgreSQL Chart of Accounts</p>
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

            <form onSubmit={handleCreateAccount}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. 1020"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Office Supplies / Petty Cash"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Account Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                    <option value="CAPITAL">CAPITAL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Minor cash disbursements for daily supplies"
                  className="form-input"
                />
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
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Account Modal ───────────────────────────── */}
      {viewingAccount && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Account Details</h3>
                <p className="modal-subtitle">Full master record from PostgreSQL database</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAccount(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{viewingAccount.name}</h4>
                  <span className="customer-code" style={{ fontSize: '0.9rem' }}>
                    Code: {viewingAccount.code}
                  </span>
                </div>
                <span className={`badge ${TYPE_CONFIG[viewingAccount.type]?.badgeClass || 'badge-admin'}`}>
                  {viewingAccount.type}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                  <p style={{ margin: '4px 0 0 0' }}>
                    <span className={`badge ${STATUS_CONFIG[viewingAccount.status]?.badgeClass || 'badge-active'}`}>
                      {viewingAccount.status || 'ACTIVE'}
                    </span>
                  </p>
                </div>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Journal References</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {viewingAccount._count?.journalItems || 0} entry line(s)
                  </p>
                </div>
              </div>

              <div className="detail-box">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                  {viewingAccount.description || 'No description provided.'}
                </p>
              </div>

              <div className="detail-box">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</label>
                <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.15rem', color: viewingAccount.balance < 0 ? 'var(--error)' : 'var(--text-primary)' }}>
                  {formatCurrency(Number(viewingAccount.balance || 0))}
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
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

      {/* ── Edit Account Modal ───────────────────────────── */}
      {editingAccount && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Edit Account</h3>
                <p className="modal-subtitle">Update account metadata in PostgreSQL</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
            {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

            <form onSubmit={handleUpdateAccount}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={editFormData.code}
                    onChange={handleEditInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Account Type *</label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                    <option value="CAPITAL">CAPITAL</option>
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

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete / Archive Confirmation Modal ──────────── */}
      {deletingAccount && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--error)' }}>Manage Account</h3>
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ margin: '16px 0' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>
                Selected Account: <strong>{deletingAccount.name}</strong> (Code: <code>{deletingAccount.code}</code>)
              </p>

              {(deletingAccount._count?.journalItems || 0) > 0 ? (
                <div
                  className="alert alert-warning"
                  style={{ fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '16px' }}
                >
                  ⚠️ <strong>Accounting Protection:</strong> This account is currently linked to{' '}
                  <strong>{deletingAccount._count.journalItems}</strong> journal entry record(s).
                  Permanent deletion would break historical general ledger reports. You can archive it by
                  setting its status to <strong>INACTIVE</strong>.
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  This account has no linked journal items. It can be safely deleted or archived.
                </p>
              )}
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleArchiveAccount(deletingAccount)}
                className="btn"
                style={{ background: '#d97706', color: '#fff', border: 'none' }}
              >
                Archive (Set Inactive)
              </button>

              {(deletingAccount._count?.journalItems || 0) === 0 && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteAccount}
                  className="btn"
                  style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
                >
                  {submitting ? 'Deleting...' : 'Permanent Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Import CSV Modal ─────────────────────────────── */}
      {showImportModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3>Import Chart of Accounts</h3>
                <p className="modal-subtitle">Upload a CSV file to batch-import financial accounts</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setParsedRows([]);
                  setImportError('');
                  setImportSummary(null);
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Required headers: <code>Account Name</code>, <code>Type</code>, <code>Code</code>, <code>Description</code>, <code>Status</code>
              </div>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="btn btn-secondary"
                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ⬇️ Download Sample CSV
              </button>
            </div>

            {/* File Dropzone */}
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--bg-primary)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {csvFile ? csvFile.name : 'Click to select a CSV file'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Valid types: ASSET, LIABILITY, EXPENSE, INCOME, CAPITAL
              </p>
            </div>

            {importError && <div className="alert alert-error mt-4">{importError}</div>}
            {importSummary && (
              <div className="alert alert-success mt-4">
                🎉 Import successful! {importSummary.created} created, {importSummary.updated} updated.
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>
                    CSV Preview ({parsedRows.length} rows detected)
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                      ✓ {parsedRows.filter((r) => r.isValid).length} Valid
                    </span>
                    {parsedRows.filter((r) => !r.isValid).length > 0 && (
                      <span style={{ color: 'var(--error)', fontWeight: 600 }}>
                        ✕ {parsedRows.filter((r) => !r.isValid).length} Invalid
                      </span>
                    )}
                  </div>
                </div>

                <div className="import-preview-table-wrapper">
                  <table className="import-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: '35px' }}>#</th>
                        <th>Account Name</th>
                        <th>Type</th>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r) => (
                        <tr key={r.rowNumber} style={{ background: r.isValid ? 'inherit' : 'rgba(198, 40, 40, 0.05)' }}>
                          <td>{r.rowNumber}</td>
                          <td>
                            <strong>{r.name || '—'}</strong>
                          </td>
                          <td>
                            <span className={`badge ${TYPE_CONFIG[r.type]?.badgeClass || 'badge-admin'}`}>
                              {r.type || '—'}
                            </span>
                          </td>
                          <td>
                            <code>{r.code || '—'}</code>
                          </td>
                          <td>{r.status}</td>
                          <td>
                            {r.isValid ? (
                              <span className="import-valid-badge">✓ Valid</span>
                            ) : (
                              <span className="import-invalid-badge" title={r.errors.join(', ')}>
                                ✕ {r.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setParsedRows([]);
                  setImportError('');
                  setImportSummary(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importSubmitting || parsedRows.filter((r) => r.isValid).length === 0}
                onClick={handleExecuteImport}
                className="btn btn-primary"
              >
                {importSubmitting
                  ? 'Importing...'
                  : `Import ${parsedRows.filter((r) => r.isValid).length} Accounts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default ChartOfAccountsPage;

