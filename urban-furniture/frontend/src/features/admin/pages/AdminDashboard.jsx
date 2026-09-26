import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import { ROUTES } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';
import erpApi from '../../../services/erpApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await erpApi.getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpi = stats?.kpi || {
    totalSales: 0,
    totalPurchases: 0,
    receivables: 0,
    payables: 0,
    customersCount: 0,
    vendorsCount: 0,
    productsCount: 0,
  };
  const recentVendorPayment = stats?.recentPayments?.find((payment) => payment.paymentType === 'OUTBOUND');
  const receivedPurchaseOrder = stats?.recentPurchaseOrders?.find((order) => order.status === 'RECEIVED');

  const quickActions = [
    { label: '+ Add Customer', route: ROUTES.CUSTOMER_MANAGEMENT, icon: '👤' },
    { label: '+ Add Vendor', route: `${ROUTES.CONTACTS}?type=VENDOR`, icon: '🚚' },
    { label: '+ Add Product', route: ROUTES.PRODUCTS, icon: '🛋️' },
    { label: '🛍️ Create Sales Order', route: ROUTES.SALES_ORDERS, icon: '🛍️' },
    { label: '📦 Create Purchase Order', route: ROUTES.PURCHASE_ORDERS, icon: '📦' },
    { label: '💳 Record Payment', route: ROUTES.PAYMENTS, icon: '💳' },
  ];

  return (
    <ErpLayout title="Urban Furniture ERP" subtitle="Administrative Control & Accounting Operations">
      {/* Welcome banner */}
      <div className="dashboard-welcome" style={{ marginBottom: '24px' }}>
        <div className="welcome-text">
          <h2>Welcome back, {user?.name || 'Admin'}</h2>
          <p>Real-time accounting overview for Urban Furniture Platform</p>
        </div>
        <span className="badge badge-admin" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          System Administrator
        </span>
      </div>

      {kpi.pendingPurchaseOrders > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
          <span><strong>New Purchase Order Approval</strong> · {kpi.pendingPurchaseOrders} purchase order{ kpi.pendingPurchaseOrders === 1 ? '' : 's' } waiting for confirmation.</span>
          <button type="button" className="btn btn-primary" onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}>Review Orders</button>
        </div>
      )}
      {receivedPurchaseOrder && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          Goods received for <strong>{receivedPurchaseOrder.orderNumber}</strong> from {receivedPurchaseOrder.vendor?.name || 'vendor'}.
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '12px' }} onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}>View Purchase Orders</button>
        </div>
      )}
      {recentVendorPayment && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          Vendor payment recorded: <strong>{recentVendorPayment.paymentNumber}</strong> for {recentVendorPayment.vendorBill?.vendor?.name || recentVendorPayment.contact?.name || 'vendor'}.
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '12px' }} onClick={() => navigate(ROUTES.PAYMENTS)}>View Payment</button>
        </div>
      )}

      {/* 4 Core Financial KPI Cards */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <div className="kpi-icon-box green">💰</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Sales</span>
            <span className="kpi-val" style={{ color: 'var(--success)' }}>
              ₹{kpi.totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box amber">📦</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Purchases</span>
            <span className="kpi-val" style={{ color: 'var(--error)' }}>
              ₹{kpi.totalPurchases.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box blue">📥</div>
          <div className="kpi-details">
            <span className="kpi-label">Receivables (AR)</span>
            <span className="kpi-val" style={{ color: '#4664a0' }}>
              ₹{kpi.receivables.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box gold">📤</div>
          <div className="kpi-details">
            <span className="kpi-label">Payables (AP)</span>
            <span className="kpi-val" style={{ color: 'var(--accent-gold)' }}>
              ₹{kpi.payables.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>
          ⚡ Fast Accounting Actions
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => navigate(qa.route)}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales vs Purchases Overview & Recent Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Sales vs Purchases Comparison */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            📊 Sales vs. Purchases Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Sales Revenue</span>
                <strong style={{ color: 'var(--success)' }}>₹{kpi.totalSales.toLocaleString()}</strong>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-primary)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${kpi.totalSales > 0 ? Math.min(100, Math.round((kpi.totalSales / (kpi.totalSales + kpi.totalPurchases || 1)) * 100)) : 0}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  borderRadius: '6px',
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Procurement Purchases</span>
                <strong style={{ color: 'var(--error)' }}>₹{kpi.totalPurchases.toLocaleString()}</strong>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-primary)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${kpi.totalPurchases > 0 ? Math.min(100, Math.round((kpi.totalPurchases / (kpi.totalSales + kpi.totalPurchases || 1)) * 100)) : 0}%`,
                  height: '100%',
                  background: '#c0392b',
                  borderRadius: '6px',
                }} />
              </div>
            </div>

            <div style={{
              marginTop: '10px',
              padding: '14px',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operating Gross Balance:</span>
              <strong style={{ fontSize: '1.1rem', color: (kpi.totalSales - kpi.totalPurchases) >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ₹{(kpi.totalSales - kpi.totalPurchases).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Master Directory Counts */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            🏢 Master Records Directory
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }}
              onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}
            >
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <div style={{ marginTop: '8px', fontSize: '1.3rem', fontWeight: 700 }}>{kpi.customersCount}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered Customers</div>
            </div>

            <div
              style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }}
              onClick={() => navigate(`${ROUTES.CONTACTS}?type=VENDOR`)}
            >
              <span style={{ fontSize: '1.5rem' }}>🚚</span>
              <div style={{ marginTop: '8px', fontSize: '1.3rem', fontWeight: 700 }}>{kpi.vendorsCount}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Supply Vendors</div>
            </div>

            <div
              style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }}
              onClick={() => navigate(ROUTES.PRODUCTS)}
            >
              <span style={{ fontSize: '1.5rem' }}>🛋️</span>
              <div style={{ marginTop: '8px', fontSize: '1.3rem', fontWeight: 700 }}>{kpi.productsCount}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Furniture Products</div>
            </div>

            <div
              style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }}
              onClick={() => navigate(ROUTES.CHART_OF_ACCOUNTS)}
            >
              <span style={{ fontSize: '1.5rem' }}>📑</span>
              <div style={{ marginTop: '8px', fontSize: '1.3rem', fontWeight: 700 }}>Chart of Accounts</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ledger Classifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Payments */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Recent Settlement Transactions</h3>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PAYMENTS)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            View All Payments →
          </button>
        </div>
        <div className="erp-table-scroll">
          {stats?.recentPayments?.length > 0 ? (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Direction</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="customer-code">{p.paymentNumber}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.date).toLocaleDateString()}</td>
                    <td><strong>{p.contact?.name || '—'}</strong></td>
                    <td>
                      <span className={`badge ${p.paymentType === 'INBOUND' ? 'badge-active' : 'badge-purchase'}`}>
                        {p.paymentType}
                      </span>
                    </td>
                    <td><span className="badge badge-admin">{p.method}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.paymentType === 'INBOUND' ? 'var(--success)' : 'var(--error)' }}>
                      ₹{p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No payments recorded yet.
            </div>
          )}
        </div>
      </div>
    </ErpLayout>
  );
};

export default AdminDashboard;
