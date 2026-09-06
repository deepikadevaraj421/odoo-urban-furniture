import { useState, useEffect, useMemo } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const JournalEntriesPage = () => {
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // KPIs
  const [kpiData, setKpiData] = useState({
    totalEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    thisMonthCount: 0,
    entriesChangeText: '+12%',
    debitChangeText: '+8%',
    creditChangeText: '+8%',
    thisMonthChangeText: '+20%',
  });

  // Filter & Search State
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: 'ALL',
    status: 'ALL',
    startDate: '',
    endDate: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  // Form State for Add / Edit Modal
  const [formJournalId, setFormJournalId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReference, setFormReference] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formItems, setFormItems] = useState([
    { accountId: '', label: '', debit: '', credit: '' },
    { accountId: '', label: '', debit: '', credit: '' },
  ]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch initial master data (Journals and Accounts)
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [jRes, aRes] = await Promise.all([
          erpApi.getJournals(),
          erpApi.getAccounts({ limit: 1000 }),
        ]);
        setJournals(jRes.data.journals || []);
        setAccounts(aRes.data.accounts || []);
      } catch (err) {
        console.error('Failed to load journals or accounts:', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch entries with current filters and pagination
  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.type && appliedFilters.type !== 'ALL') params.type = appliedFilters.type;
      if (appliedFilters.status && appliedFilters.status !== 'ALL') params.status = appliedFilters.status;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

      const res = await erpApi.getJournalEntries(params);
      setEntries(res.data.entries || []);
      setTotalEntries(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);

      if (res.data.kpis) {
        setKpiData(res.data.kpis);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load journal entries from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [currentPage, pageSize, appliedFilters]);

  // Search & Filter Handlers
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      search: searchInput.trim(),
      type: typeFilter,
      status: statusFilter,
      startDate,
      endDate,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
    setCurrentPage(1);
    setAppliedFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  // Live Balance Calculation for Form
  const formTotalDebit = useMemo(() => {
    return Math.round(formItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0) * 100) / 100;
  }, [formItems]);

  const formTotalCredit = useMemo(() => {
    return Math.round(formItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0) * 100) / 100;
  }, [formItems]);

  const formDifference = useMemo(() => {
    return Math.abs(formTotalDebit - formTotalCredit);
  }, [formTotalDebit, formTotalCredit]);

  const isFormBalanced = formTotalDebit > 0 && formTotalCredit > 0 && formDifference < 0.01;

  // Form Item Changes
  const handleItemChange = (index, field, value) => {
    setFormItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddFormLine = () => {
    setFormItems((prev) => [...prev, { accountId: '', label: '', debit: '', credit: '' }]);
  };

  const handleRemoveFormLine = (index) => {
    if (formItems.length <= 2) return;
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormJournalId(journals.length > 0 ? journals[0].id : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReference('');
    setFormDescription('');
    setFormItems([
      { accountId: '', label: '', debit: '', credit: '' },
      { accountId: '', label: '', debit: '', credit: '' },
    ]);
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormJournalId(entry.journalId);
    setFormDate(new Date(entry.date).toISOString().split('T')[0]);
    setFormReference(entry.entryNumber || '');
    setFormDescription(entry.reference || '');
    setFormItems(
      entry.items?.length >= 2
        ? entry.items.map((it) => ({
            accountId: it.accountId,
            label: it.label || '',
            debit: it.debit > 0 ? it.debit : '',
            credit: it.credit > 0 ? it.credit : '',
          }))
        : [
            { accountId: '', label: '', debit: '', credit: '' },
            { accountId: '', label: '', debit: '', credit: '' },
          ]
    );
    setFormError('');
    setFormSuccess('');
  };

  // Save Journal Entry (either as DRAFT or POSTED)
  const handleSaveEntry = async (targetStatus) => {
    if (targetStatus === 'POSTED' && !isFormBalanced) {
      setFormError('Journal entry is not balanced. Total debit must equal total credit.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const payload = {
      journalId: formJournalId || (journals.length > 0 ? journals[0].id : undefined),
      date: formDate,
      reference: formReference.trim() || undefined,
      description: formDescription.trim() || undefined,
      status: targetStatus,
      items: formItems.map((it) => ({
        accountId: it.accountId,
        label: it.label || formDescription || undefined,
        debit: parseFloat(it.debit) || 0,
        credit: parseFloat(it.credit) || 0,
      })),
    };

    try {
      if (editingEntry) {
        await erpApi.updateJournalEntry(editingEntry.id, payload);
        setFormSuccess(targetStatus === 'POSTED' ? 'Journal entry posted successfully!' : 'Journal entry updated!');
      } else {
        await erpApi.createJournalEntry(payload);
        setFormSuccess(targetStatus === 'POSTED' ? 'Journal entry posted successfully!' : 'Journal entry draft saved!');
      }

      fetchEntries();
      setTimeout(() => {
        setShowAddModal(false);
        setEditingEntry(null);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save journal entry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Direct Post Draft Entry
  const handlePostDraftEntry = async (id) => {
    try {
      await erpApi.postJournalEntry(id);
      fetchEntries();
      if (viewingEntry && viewingEntry.id === id) {
        setViewingEntry((prev) => ({ ...prev, status: 'POSTED' }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post entry.');
    }
  };

  // Delete Entry
  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    try {
      await erpApi.deleteJournalEntry(deletingEntry.id);
      setDeletingEntry(null);
      fetchEntries();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete journal entry.');
    }
  };

  // Format Date (e.g. 05 Sep 2025)
  const formatDateDisplay = (dateStr) => formatDate(dateStr);

  // Format Currency (₹ 2,48,750.00)
  // formatCurrency imported from formatters

  return (
    <ErpLayout title="Journal Entries" subtitle="Double-Entry General Ledger Postings">
      <div className="je-page-container">
        {/* Breadcrumb & Header */}
        <div>
          <div className="je-breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span>Accounting</span>
            <span>&gt;</span>
            <span className="current">Journal Entries</span>
          </div>

          <div className="je-header-row">
            <div className="je-header-left">
              <h2>Journal Entries</h2>
              <p>Record and manage all accounting journal entries</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="je-add-btn"
            >
              <span>+</span> Add Journal Entry
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="je-kpi-grid">
          {/* Card 1: Total Entries */}
          <div className="je-kpi-card">
            <div className="je-kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="je-kpi-details">
              <span className="je-kpi-label">Total Entries</span>
              <span className="je-kpi-val">{kpiData.totalEntries}</span>
              <div className="je-kpi-trend">
                <span className="je-trend-badge">↑ {kpiData.entriesChangeText}</span>
                <span className="je-trend-sub">vs. last month</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Debit */}
          <div className="je-kpi-card">
            <div className="je-kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
            <div className="je-kpi-details">
              <span className="je-kpi-label">Total Debit</span>
              <span className="je-kpi-val">{formatCurrency(kpiData.totalDebit)}</span>
              <div className="je-kpi-trend">
                <span className="je-trend-badge">↑ {kpiData.debitChangeText}</span>
                <span className="je-trend-sub">vs. last month</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Credit */}
          <div className="je-kpi-card">
            <div className="je-kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
            <div className="je-kpi-details">
              <span className="je-kpi-label">Total Credit</span>
              <span className="je-kpi-val">{formatCurrency(kpiData.totalCredit)}</span>
              <div className="je-kpi-trend">
                <span className="je-trend-badge">↑ {kpiData.creditChangeText}</span>
                <span className="je-trend-sub">vs. last month</span>
              </div>
            </div>
          </div>

          {/* Card 4: This Month */}
          <div className="je-kpi-card">
            <div className="je-kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="je-kpi-details">
              <span className="je-kpi-label">This Month</span>
              <span className="je-kpi-val">{kpiData.thisMonthCount}</span>
              <div className="je-kpi-trend">
                <span className="je-trend-badge">↑ {kpiData.thisMonthChangeText}</span>
                <span className="je-trend-sub">vs. last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <form onSubmit={handleSearchSubmit} className="je-toolbar">
          <div className="je-search-box">
            <span className="je-search-icon">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by reference, description, account..."
              className="je-search-input"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="je-select"
          >
            <option value="ALL">All Types</option>
            <option value="SALES">Sales</option>
            <option value="PURCHASE">Purchase</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="je-select"
          >
            <option value="ALL">All Status</option>
            <option value="POSTED">POSTED</option>
            <option value="DRAFT">DRAFT</option>
          </select>

          <button type="submit" className="je-btn-search">
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowDateFilter((v) => !v)}
            className={`je-btn-outline ${showDateFilter ? 'active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="je-btn-outline"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Reset
          </button>
        </form>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="je-date-filter-panel">
            <div className="je-date-item">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="je-date-input"
              />
            </div>
            <div className="je-date-item">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="je-date-input"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="btn btn-primary"
              style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem' }}
            >
              Apply Date Range
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setAppliedFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
              }}
              className="btn btn-secondary"
              style={{ height: '36px', padding: '0 12px', fontSize: '0.82rem' }}
            >
              Clear Dates
            </button>
          </div>
        )}

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {/* Main Table Card */}
        <div className="je-table-card">
          <div className="je-table-top-bar">
            <div className="je-table-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Journal Entries ({totalEntries})</span>
            </div>

            <div className="je-show-entries">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="je-show-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="je-table-responsive">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading journal entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="empty-state" style={{ margin: '40px auto' }}>
                <div className="empty-state-icon">⚖️</div>
                <h3>No journal entries found</h3>
                <p>Try adjusting your search or filters, or click "+ Add Journal Entry" to create one.</p>
              </div>
            ) : (
              <table className="je-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '130px' }}>DATE</th>
                    <th style={{ width: '140px' }}>REFERENCE</th>
                    <th>DESCRIPTION</th>
                    <th style={{ width: '140px' }}>DEBIT</th>
                    <th style={{ width: '140px' }}>CREDIT</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>STATUS</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    const descriptionText =
                      entry.reference ||
                      entry.items?.[0]?.label ||
                      (entry.journal?.name ? `${entry.journal.name} Entry` : 'Journal Entry');

                    return (
                      <tr key={entry.id}>
                        <td className="je-row-num">{rowNumber}</td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDateDisplay(entry.date)}
                        </td>
                        <td>
                          <span
                            className="je-ref-link"
                            onClick={() => setViewingEntry(entry)}
                            title="Click to view details"
                          >
                            {entry.entryNumber}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {descriptionText}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(entry.totalDebit)}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(entry.totalCredit)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {entry.status === 'POSTED' ? (
                            <span className="je-badge-posted">POSTED</span>
                          ) : entry.status === 'DRAFT' ? (
                            <span className="je-badge-draft">DRAFT</span>
                          ) : (
                            <span className="je-badge-cancelled">{entry.status}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setViewingEntry(entry)}
                              className="je-action-btn view"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(entry)}
                              className="je-action-btn edit"
                              title="Edit Entry"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingEntry(entry)}
                              className="je-action-btn delete"
                              title="Delete Entry"
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

          {/* Table Pagination Footer */}
          {totalEntries > 0 && (
            <div className="je-table-footer">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
              </div>

              <div className="je-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="je-page-btn"
                  title="Previous Page"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    totalPages > 7 &&
                    p !== 1 &&
                    p !== totalPages &&
                    Math.abs(p - currentPage) > 2
                  ) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`je-page-btn ${currentPage === p ? 'active' : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="je-page-btn"
                  title="Next Page"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            MODAL 1: VIEW DETAILS MODAL
            ============================================================ */}
        {viewingEntry && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(820px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}>{viewingEntry.entryNumber}</h3>
                    {viewingEntry.status === 'POSTED' ? (
                      <span className="je-badge-posted">POSTED</span>
                    ) : (
                      <span className="je-badge-draft">DRAFT</span>
                    )}
                  </div>
                  <p className="modal-subtitle">Full double-entry ledger posting inspection</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingEntry(null)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              {/* Meta Grid */}
              <div className="je-meta-grid">
                <div className="je-meta-item">
                  <label>Journal</label>
                  <span>{viewingEntry.journal?.name || '—'} ({viewingEntry.journal?.type})</span>
                </div>
                <div className="je-meta-item">
                  <label>Date</label>
                  <span>{formatDateDisplay(viewingEntry.date)}</span>
                </div>
                <div className="je-meta-item">
                  <label>Reference</label>
                  <span>{viewingEntry.entryNumber}</span>
                </div>
                <div className="je-meta-item">
                  <label>Description</label>
                  <span>{viewingEntry.reference || '—'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Journal Items ({viewingEntry.items?.length || 0})
                </h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Account</th>
                        <th style={{ padding: '8px 12px' }}>Label / Notes</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Debit</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingEntry.items?.map((it) => (
                        <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{it.account?.code}</strong> - {it.account?.name}
                            <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              ({it.account?.type})
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {it.label || '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {it.debit > 0 ? formatCurrency(it.debit) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {it.credit > 0 ? formatCurrency(it.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--bg-card)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                        <td colSpan={2} style={{ padding: '12px', textAlign: 'right' }}>
                          Total:
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#065f46', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(viewingEntry.totalDebit)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#065f46', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(viewingEntry.totalCredit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  {viewingEntry.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => handlePostDraftEntry(viewingEntry.id)}
                      className="btn btn-primary"
                      style={{ background: '#065f46' }}
                    >
                      ✓ Post Entry Now
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const entryToEdit = viewingEntry;
                      setViewingEntry(null);
                      handleOpenEditModal(entryToEdit);
                    }}
                    className="btn btn-secondary"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingEntry(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 2: ADD / EDIT JOURNAL ENTRY MODAL
            ============================================================ */}
        {(showAddModal || editingEntry) && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(860px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <div>
                  <h3>{editingEntry ? 'Edit Journal Entry' : 'Create Journal Entry'}</h3>
                  <p className="modal-subtitle">Enforcing Double-Entry Rule: Total Debit must equal Total Credit</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                  }}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              {formError && <div className="alert alert-error mb-4">{formError}</div>}
              {formSuccess && <div className="alert alert-success mb-4">{formSuccess}</div>}

              <div>
                {/* Header Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Journal *</label>
                    <select
                      value={formJournalId}
                      onChange={(e) => setFormJournalId(e.target.value)}
                      className="form-input"
                      style={{ height: '42px' }}
                      required
                    >
                      {journals.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name} ({j.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="form-input"
                      style={{ height: '42px' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reference</label>
                    <input
                      type="text"
                      value={formReference}
                      onChange={(e) => setFormReference(e.target.value)}
                      placeholder="e.g. JV-00028"
                      className="form-input"
                      style={{ height: '42px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Sales Invoice - customer reference"
                      className="form-input"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                {/* Journal Items Table */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Journal Lines (Debit & Credit)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddFormLine}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                      + Add Line
                    </button>
                  </div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Account *</th>
                          <th style={{ padding: '8px 12px' }}>Line Note / Label</th>
                          <th style={{ padding: '8px 12px', width: '130px', textAlign: 'right' }}>Debit (₹)</th>
                          <th style={{ padding: '8px 12px', width: '130px', textAlign: 'right' }}>Credit (₹)</th>
                          <th style={{ padding: '8px 12px', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px 8px' }}>
                              <select
                                value={item.accountId}
                                onChange={(e) => handleItemChange(idx, 'accountId', e.target.value)}
                                className="form-input"
                                style={{ height: '38px', padding: '0 8px', fontSize: '0.82rem' }}
                                required
                              >
                                <option value="">-- Select Account --</option>
                                {accounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.code} - {a.name} ({a.type})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                                placeholder="Line description"
                                className="form-input"
                                style={{ height: '38px', padding: '0 8px', fontSize: '0.82rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.debit}
                                onChange={(e) => handleItemChange(idx, 'debit', e.target.value)}
                                placeholder="0.00"
                                className="form-input"
                                style={{ height: '38px', padding: '0 8px', textAlign: 'right', fontSize: '0.82rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.credit}
                                onChange={(e) => handleItemChange(idx, 'credit', e.target.value)}
                                placeholder="0.00"
                                className="form-input"
                                style={{ height: '38px', padding: '0 8px', textAlign: 'right', fontSize: '0.82rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              {formItems.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormLine(idx)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                                  title="Remove line"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'var(--bg-card)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                          <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right' }}>
                            Totals:
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#065f46' }}>
                            {formatCurrency(formTotalDebit)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#065f46' }}>
                            {formatCurrency(formTotalCredit)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Real-time Balance Box */}
                <div className={`je-balance-box ${isFormBalanced ? 'balanced' : 'unbalanced'}`}>
                  <span style={{ fontSize: '1.2rem' }}>{isFormBalanced ? '✅' : '⚠️'}</span>
                  <div>
                    <strong>{isFormBalanced ? 'Balanced Entry' : 'Unbalanced Entry'}</strong>:{' '}
                    {isFormBalanced
                      ? 'Total Debit equals Total Credit. Entry is ready for posting.'
                      : `Total Debit (${formatCurrency(formTotalDebit)}) must equal Total Credit (${formatCurrency(formTotalCredit)}). Difference: ${formatCurrency(formDifference)}.`}
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEntry(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => handleSaveEntry('DRAFT')}
                    className="btn btn-secondary"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={formSubmitting || !isFormBalanced}
                    onClick={() => handleSaveEntry('POSTED')}
                    className="btn btn-primary"
                    style={{ background: '#065f46' }}
                  >
                    {formSubmitting ? 'Posting Entry...' : 'Post Journal Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 3: DELETE CONFIRMATION MODAL
            ============================================================ */}
        {deletingEntry && (
          <div className="modal-overlay customer-modal">
            <div className="modal-card" style={{ width: 'min(480px, calc(100vw - 32px))' }}>
              <div className="modal-header">
                <h3>Delete Journal Entry</h3>
                <button
                  type="button"
                  onClick={() => setDeletingEntry(null)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p>
                  Are you sure you want to delete journal entry{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{deletingEntry.entryNumber}</strong>?
                </p>
                {deletingEntry.status === 'POSTED' && (
                  <div className="alert alert-error" style={{ marginTop: '12px' }}>
                    ⚠️ This entry is <strong>POSTED</strong>. Deleting it will automatically reverse the account balances in the General Ledger.
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setDeletingEntry(null)}
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
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErpLayout>
  );
};

export default JournalEntriesPage;

