import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import { SkeletonTable, StatusBadge, EmptyState } from '../components/CustomerUI';
import customerApi from '../../../services/customerApi';

const MOCK_ORDERS = [
  { id: '1', orderNumber: 'ORD-0001', createdAt: '2026-08-01', status: 'INVOICED', orderItems: [{ productName: '3-Seater Sofa' }, { productName: 'Coffee Table' }], invoices: [{ id: '1', invoiceNumber: 'INV-1024' }] },
  { id: '2', orderNumber: 'ORD-0002', createdAt: '2026-07-10', status: 'CONFIRMED', orderItems: [{ productName: 'Dining Set (6 chairs)' }], invoices: [] },
  { id: '3', orderNumber: 'ORD-0003', createdAt: '2026-06-20', status: 'INVOICED', orderItems: [{ productName: 'Wardrobe - 4 Door' }, { productName: 'Bedside Table x2' }], invoices: [{ id: '3', invoiceNumber: 'INV-0993' }] },
];

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const THEME_KEY = 'cp_theme';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); localStorage.setItem(THEME_KEY, next);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getOrders();
      setOrders(res.data.orders || []);
      setDemoMode(false);
    } catch {
      setOrders(MOCK_ORDERS);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="cp-main">
          <CustomerHeader onToggleSidebar={() => setSidebarOpen(p => !p)} theme={theme} onToggleTheme={toggleTheme} />
          <main className="cp-page" id="cp-orders-page">
            <div className="cp-page-header"><h1 className="cp-page-title">My Orders</h1></div>

            {demoMode && (
              <div style={{ background: '#fef3cd', border: '1px solid #f0c040', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92650a' }}>
                🎭 <strong>Demo Mode</strong> — Showing sample data. Connect PostgreSQL to see live data.
              </div>
            )}

            <div className="cp-section-card">
              {loading ? <SkeletonTable rows={5} /> : orders.length === 0 ? (
                <EmptyState icon="📦" title="No orders yet" sub="Your sales orders created by Urban Furniture will appear here." />
              ) : (
                <div className="cp-table-wrap">
                  <table className="cp-table" aria-label="Orders table">
                    <thead>
                      <tr><th>Order No.</th><th>Date</th><th>Items</th><th>Status</th><th>Invoice</th></tr>
                    </thead>
                    <tbody>
                      {orders.map(order => {
                        const inv = order.invoices?.[0];
                        return (
                          <tr key={order.id}>
                            <td style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{order.orderNumber}</td>
                            <td>{fmtDate(order.createdAt)}</td>
                            <td style={{ color: 'var(--cp-text-muted)' }}>{(order.orderItems || []).map(i => i.productName).join(', ') || '—'}</td>
                            <td><StatusBadge status={order.status} /></td>
                            <td>
                              {inv ? (
                                <button className="cp-btn-view" onClick={() => navigate(`/customer/invoices/${inv.id}`)} id={`cp-order-inv-${order.id}`}>{inv.invoiceNumber}</button>
                              ) : (
                                <span style={{ color: 'var(--cp-text-muted)', fontSize: '0.82rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
        <button className="cp-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="Open navigation" id="cp-mobile-menu-orders" style={{ display: 'flex' }}>☰</button>
      </div>
    </div>
  );
};

export default CustomerOrders;
