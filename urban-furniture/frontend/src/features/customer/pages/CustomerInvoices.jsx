import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import { SkeletonTable, StatusBadge, EmptyState, ErrorBox } from '../components/CustomerUI';
import PaymentModal from '../components/PaymentModal';
import customerApi from '../../../services/customerApi';

const MOCK_INVOICES = [
  { id: '1', invoiceNumber: 'INV-1024', invoiceDate: '2026-09-05', dueDate: '2026-09-20', totalAmount: 25000, paidAmount: 25000, outstanding: 0, status: 'PAID' },
  { id: '2', invoiceNumber: 'INV-1087', invoiceDate: '2026-08-18', dueDate: '2026-09-18', totalAmount: 12000, paidAmount: 0, outstanding: 12000, status: 'PENDING' },
  { id: '3', invoiceNumber: 'INV-0993', invoiceDate: '2026-08-02', dueDate: '2026-09-02', totalAmount: 18500, paidAmount: 18500, outstanding: 0, status: 'PAID' },
  { id: '4', invoiceNumber: 'INV-0741', invoiceDate: '2026-07-21', dueDate: '2026-08-21', totalAmount: 32000, paidAmount: 32000, outstanding: 0, status: 'PAID' },
  { id: '5', invoiceNumber: 'INV-0612', invoiceDate: '2026-07-10', dueDate: '2026-08-10', totalAmount: 45000, paidAmount: 10000, outstanding: 35000, status: 'PARTIALLY_PAID' },
];

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const THEME_KEY = 'cp_theme';
const STATUS_OPTIONS = ['', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];

const CustomerInvoices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [sortOrder, setSortOrder] = useState('desc');
  const [payInvoice, setPayInvoice] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.getInvoices({ status: statusFilter || undefined, search: searchVal || undefined, sortOrder });
      setInvoices(res.data.invoices || []);
      setDemoMode(false);
    } catch (e) {
      let filtered = MOCK_INVOICES;
      if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      if (searchVal) filtered = filtered.filter(i => i.invoiceNumber.toLowerCase().includes(searchVal.toLowerCase()));
      setInvoices(filtered);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchVal, sortOrder]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="cp-main">
          <CustomerHeader onToggleSidebar={() => setSidebarOpen(p => !p)} theme={theme} onToggleTheme={toggleTheme} />
          <main className="cp-page" id="cp-invoices-page">
            <div className="cp-page-header">
              <h1 className="cp-page-title">My Invoices</h1>
            </div>

            {demoMode && (
              <div style={{ background: '#fef3cd', border: '1px solid #f0c040', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92650a' }}>
                🎭 <strong>Demo Mode</strong> — Showing sample data. Connect PostgreSQL to see live data.
              </div>
            )}
            {successMsg && <div className="cp-alert success">✅ {successMsg}</div>}
            {error && <ErrorBox message={error} />}

            <div className="cp-filter-row">
              <input className="cp-filter-input" type="text" placeholder="Search invoice number..." value={searchVal} onChange={e => setSearchVal(e.target.value)} aria-label="Search invoices" id="cp-invoice-search" />
              <select className="cp-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" id="cp-status-filter">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
              </select>
              <select className="cp-filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)} id="cp-sort-filter">
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            <div className="cp-section-card">
              {loading ? <SkeletonTable rows={6} /> : invoices.length === 0 ? (
                <EmptyState icon="📄" title="No invoices found" sub={statusFilter ? `No ${statusFilter.toLowerCase()} invoices.` : 'Your invoices will appear here once an order is processed.'} />
              ) : (
                <div className="cp-table-wrap">
                  <table className="cp-table" aria-label="Invoices table">
                    <thead>
                      <tr><th>Invoice No.</th><th>Date</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id}>
                          <td className="inv-num">{inv.invoiceNumber}</td>
                          <td>{fmtDate(inv.invoiceDate)}</td>
                          <td>{fmtDate(inv.dueDate)}</td>
                          <td>{fmt(inv.totalAmount)}</td>
                          <td style={{ color: 'var(--cp-green)', fontWeight: 600 }}>{fmt(inv.paidAmount)}</td>
                          <td style={{ color: inv.outstanding > 0 ? 'var(--cp-red)' : 'inherit', fontWeight: 600 }}>{fmt(inv.outstanding)}</td>
                          <td><StatusBadge status={inv.status} /></td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="cp-btn-view" onClick={() => navigate(`/customer/invoices/${inv.id}`)} id={`cp-inv-view-${inv.id}`}>View</button>
                            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && !demoMode && (
                              <button className="cp-btn-view" onClick={() => setPayInvoice(inv)} style={{ background: 'var(--cp-green)', color: 'white', borderColor: 'var(--cp-green)' }} id={`cp-inv-pay-${inv.id}`}>Pay</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
          <footer className="cp-footer">
            <span>© 2025 Urban Furniture. All rights reserved.</span>
            <div className="cp-footer-links"><span className="cp-footer-link">Privacy</span><span className="cp-footer-link">Terms</span><span className="cp-footer-link">Support</span></div>
          </footer>
        </div>
        <button className="cp-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="Open navigation" id="cp-mobile-menu-invoices" style={{ display: 'flex' }}>☰</button>
      </div>
      {payInvoice && (
        <PaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} onPaymentSuccess={() => { setSuccessMsg('Payment recorded!'); fetchInvoices(); setTimeout(() => setSuccessMsg(''), 4000); }} />
      )}
    </div>
  );
};

export default CustomerInvoices;
