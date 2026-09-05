import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import { SummaryCard, SkeletonCard, SkeletonTable, StatusBadge, EmptyState, ErrorBox } from '../components/CustomerUI';
import PaymentModal from '../components/PaymentModal';
import customerApi from '../../../services/customerApi';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import heroImg from '../../../assets/customer-hero.jpg';

// ── Mock data shown when backend is unavailable ──
const MOCK_DASHBOARD = {
  customer: { name: 'Deepika', customerCode: 'CUST-00028' },
  stats: {
    totalInvoices: 12,
    totalPayments: 245000,
    pendingAmount: 35000,
    totalPurchases: 280000,
    totalOrders: 5,
  },
  recentInvoices: [
    { id: '1', invoiceNumber: 'INV-1024', invoiceDate: '2026-09-05', totalAmount: 25000, status: 'PAID' },
    { id: '2', invoiceNumber: 'INV-1087', invoiceDate: '2026-08-18', totalAmount: 12000, status: 'PENDING' },
    { id: '3', invoiceNumber: 'INV-0993', invoiceDate: '2026-08-02', totalAmount: 18500, status: 'PAID' },
    { id: '4', invoiceNumber: 'INV-0741', invoiceDate: '2026-07-21', totalAmount: 32000, status: 'PAID' },
    { id: '5', invoiceNumber: 'INV-0612', invoiceDate: '2026-07-10', totalAmount: 45000, status: 'PENDING' },
  ],
};

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const THEME_KEY = 'cp_theme';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Payment modal
  const [payInvoice, setPayInvoice] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getDashboard();
      setDashboard(res.data.dashboard || res.data);
      setDemoMode(false);
    } catch (e) {
      // Fallback to mock data when backend is unavailable
      console.warn('Backend unavailable — using demo data');
      setDashboard(MOCK_DASHBOARD);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const stats = dashboard?.stats || {};
  const recentInvoices = dashboard?.recentInvoices || [];
  const customerName = dashboard?.customer?.name || user?.name || '';
  const customerCode = dashboard?.customer?.customerCode || '';
  const firstName = customerName.split(' ')[0];

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        {/* Sidebar */}
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main */}
        <div className="cp-main">
          <CustomerHeader
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <main className="cp-page" id="cp-dashboard-page">
            {/* Demo mode notice */}
            {demoMode && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3cd, #fff8e7)',
                border: '1px solid #f0c040',
                borderRadius: 8,
                padding: '10px 16px',
                marginBottom: 16,
                fontSize: '0.82rem',
                color: '#92650a',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                🎭 <strong>Demo Mode</strong> — Backend not connected. Showing sample data. Connect PostgreSQL to see live data.
              </div>
            )}

            {/* ── Hero ── */}
            <div className="cp-hero" role="banner">
              <div className="cp-hero-content">
                <div className="cp-hero-greeting">Welcome Back,</div>
                <div className="cp-hero-name">{firstName || 'Customer'}</div>

                {loading ? (
                  <div className="cp-skeleton" style={{ height: 24, width: 130, borderRadius: 20, marginBottom: 10 }} />
                ) : (
                  <div className="cp-hero-id-badge" aria-label={`Customer ID: ${customerCode}`}>
                    👤 Customer ID: {customerCode || '—'}
                  </div>
                )}

                <div className="cp-hero-text">
                  Thank you for being a valued customer.<br />
                  We're glad to have you with us!
                </div>
              </div>

              <div className="cp-hero-img-wrap">
                <img src={heroImg} alt="Urban Furniture premium collection" className="cp-hero-img" />
                <div className="cp-hero-img-overlay">
                  <div className="cp-hero-img-label">Furniture<br />that feels<br />like home</div>
                </div>
              </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="cp-cards-row">
              {loading ? (
                <>
                  <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </>
              ) : (
                <>
                  <SummaryCard
                    label="Total Invoices"
                    value={stats.totalInvoices ?? 0}
                    icon="📄"
                    iconClass="green"
                    linkText="View Invoices"
                    onLink={() => navigate(ROUTES.CUSTOMER_INVOICES)}
                  />
                  <SummaryCard
                    label="Total Payments"
                    value={fmt(stats.totalPayments)}
                    icon="💳"
                    iconClass="amber"
                    linkText="View Payments"
                    onLink={() => navigate(ROUTES.CUSTOMER_PAYMENTS)}
                  />
                  <SummaryCard
                    label="Pending Amount"
                    value={fmt(stats.pendingAmount)}
                    icon="⏳"
                    iconClass="red"
                    linkText="Pay Now"
                    onLink={() => navigate(ROUTES.CUSTOMER_INVOICES + '?status=PENDING')}
                  />
                  <SummaryCard
                    label="Total Purchases"
                    value={fmt(stats.totalPurchases)}
                    icon="🛒"
                    iconClass="blue"
                    linkText="View Orders"
                    onLink={() => navigate(ROUTES.CUSTOMER_ORDERS)}
                  />
                </>
              )}
            </div>

            {/* ── Bottom Grid ── */}
            <div className="cp-bottom-grid">
              {/* Recent Invoices */}
              <div className="cp-section-card" id="cp-recent-invoices">
                <div className="cp-section-header">
                  <h2 className="cp-section-title">Recent Invoices</h2>
                  <button
                    className="cp-view-all-btn"
                    onClick={() => navigate(ROUTES.CUSTOMER_INVOICES)}
                    aria-label="View all invoices"
                    id="cp-view-all-invoices"
                  >
                    View All →
                  </button>
                </div>

                {loading ? (
                  <SkeletonTable rows={5} />
                ) : recentInvoices.length === 0 ? (
                  <EmptyState
                    icon="📭"
                    title="No invoices yet"
                    sub="Your invoices will appear here once an order is processed."
                  />
                ) : (
                  <div className="cp-table-wrap">
                    <table className="cp-table" aria-label="Recent invoices">
                      <thead>
                        <tr>
                          <th scope="col">Invoice No.</th>
                          <th scope="col">Date</th>
                          <th scope="col">Amount</th>
                          <th scope="col">Status</th>
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="inv-num">{inv.invoiceNumber}</td>
                            <td>{fmtDate(inv.invoiceDate)}</td>
                            <td>{fmt(inv.totalAmount)}</td>
                            <td><StatusBadge status={inv.status} /></td>
                            <td>
                              {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && !demoMode && (
                                <button
                                  className="cp-btn-view"
                                  onClick={() => setPayInvoice(inv)}
                                  aria-label={`Pay invoice ${inv.invoiceNumber}`}
                                  id={`cp-pay-${inv.id}`}
                                  style={{ marginRight: 6 }}
                                >
                                  Pay
                                </button>
                              )}
                              <button
                                className="cp-btn-view"
                                onClick={() => navigate(`/customer/invoices/${inv.id}`)}
                                aria-label={`View invoice ${inv.invoiceNumber}`}
                                id={`cp-view-${inv.id}`}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Panel */}
              <div className="cp-right-panel">
                {/* Profile Card */}
                <div className="cp-profile-card" id="cp-profile-summary">
                  <div className="cp-profile-card-header">
                    <span className="cp-profile-card-title">My Profile</span>
                    <button
                      className="cp-edit-btn"
                      onClick={() => navigate(ROUTES.CUSTOMER_PROFILE)}
                      id="cp-edit-profile-btn"
                      aria-label="Edit profile"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div className="cp-skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                          <div className="cp-skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                          <div className="cp-skeleton" style={{ height: 10, width: '40%' }} />
                        </div>
                      </div>
                      {[1, 2, 3].map((i) => <div key={i} className="cp-skeleton" style={{ height: 10, width: '90%' }} />)}
                    </div>
                  ) : (
                    <>
                      <div className="cp-profile-top">
                        <div className="cp-avatar-lg" aria-hidden="true">{getInitials(customerName)}</div>
                        <div>
                          <div className="cp-profile-name">{customerName}</div>
                          <div className="cp-profile-code">{customerCode}</div>
                        </div>
                      </div>
                      <div className="cp-profile-rows">
                        <div className="cp-profile-row">
                          <span className="cp-profile-row-label">Email</span>
                          <span className="cp-profile-row-val">{user?.email || '—'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Promo Card */}
                <div className="cp-promo-card">
                  <div className="cp-promo-content">
                    <div className="cp-promo-title">
                      Crafting<br />Better Living<br />Together
                    </div>
                    <button
                      className="cp-promo-btn"
                      onClick={() => navigate(ROUTES.CUSTOMER_ORDERS)}
                      id="cp-explore-products-btn"
                      aria-label="View your orders"
                    >
                      Explore Orders →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="cp-footer">
            <span>© 2025 Urban Furniture. All rights reserved.</span>
            <div className="cp-footer-links">
              <span className="cp-footer-link">Privacy</span>
              <span className="cp-footer-link">Terms</span>
              <span className="cp-footer-link">Support</span>
            </div>
          </footer>
        </div>

        {/* Mobile sidebar toggle */}
        <button
          className="cp-sidebar-toggle"
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Open navigation menu"
          id="cp-mobile-menu-btn"
          style={{ display: 'flex' }}
        >
          ☰
        </button>
      </div>

      {/* Payment Modal */}
      {payInvoice && (
        <PaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onPaymentSuccess={fetchDashboard}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
