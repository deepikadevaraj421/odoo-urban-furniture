import { useState, useEffect, useCallback } from 'react';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import { SkeletonTable, StatusBadge, EmptyState } from '../components/CustomerUI';
import customerApi from '../../../services/customerApi';

const MOCK_PAYMENTS = [
  { id: '1', paymentNumber: 'PAY-0001', invoice: { invoiceNumber: 'INV-1024' }, paidAt: '2026-09-05', amount: 25000, method: 'BANK', status: 'COMPLETED', referenceNumber: 'TXN9821234' },
  { id: '2', paymentNumber: 'PAY-0002', invoice: { invoiceNumber: 'INV-0993' }, paidAt: '2026-08-05', amount: 18500, method: 'ONLINE', status: 'COMPLETED', referenceNumber: 'UPI8823' },
  { id: '3', paymentNumber: 'PAY-0003', invoice: { invoiceNumber: 'INV-0612' }, paidAt: '2026-07-15', amount: 10000, method: 'CASH', status: 'COMPLETED', referenceNumber: null },
];

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const THEME_KEY = 'cp_theme';
const METHOD_OPTIONS = ['', 'CASH', 'BANK', 'ONLINE', 'EMI'];

const CustomerPayments = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); localStorage.setItem(THEME_KEY, next);
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getPayments({ method: methodFilter || undefined });
      setPayments(res.data.payments || []);
      setDemoMode(false);
    } catch {
      let filtered = MOCK_PAYMENTS;
      if (methodFilter) filtered = filtered.filter(p => p.method === methodFilter);
      setPayments(filtered);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [methodFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="cp-main">
          <CustomerHeader onToggleSidebar={() => setSidebarOpen(p => !p)} theme={theme} onToggleTheme={toggleTheme} />
          <main className="cp-page" id="cp-payments-page">
            <div className="cp-page-header"><h1 className="cp-page-title">My Payments</h1></div>

            {demoMode && (
              <div style={{ background: '#fef3cd', border: '1px solid #f0c040', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92650a' }}>
                🎭 <strong>Demo Mode</strong> — Showing sample data. Connect PostgreSQL to see live data.
              </div>
            )}

            <div className="cp-filter-row">
              <select className="cp-filter-select" value={methodFilter} onChange={e => setMethodFilter(e.target.value)} aria-label="Filter by payment method" id="cp-method-filter">
                {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m || 'All Methods'}</option>)}
              </select>
            </div>

            <div className="cp-section-card">
              {loading ? <SkeletonTable rows={6} /> : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" sub="Your payment history will appear here once you make a payment." />
              ) : (
                <div className="cp-table-wrap">
                  <table className="cp-table" aria-label="Payments table">
                    <thead>
                      <tr><th>Payment ID</th><th>Invoice</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Reference</th></tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{p.paymentNumber}</td>
                          <td style={{ fontWeight: 500 }}>{p.invoice?.invoiceNumber || '—'}</td>
                          <td>{fmtDate(p.paidAt)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--cp-green)' }}>{fmt(p.amount)}</td>
                          <td><StatusBadge status={p.method} /></td>
                          <td><StatusBadge status={p.status} /></td>
                          <td style={{ color: 'var(--cp-text-muted)', fontSize: '0.82rem' }}>{p.referenceNumber || '—'}</td>
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
        <button className="cp-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="Open navigation" id="cp-mobile-menu-payments" style={{ display: 'flex' }}>☰</button>
      </div>
    </div>
  );
};

export default CustomerPayments;
