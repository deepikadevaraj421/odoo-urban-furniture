import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import { customerApi } from '../../../services/authApi';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import CustomerSandboxPayment from '../components/CustomerSandboxPayment';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pay modal
  const [payModalInvoice, setPayModalInvoice] = useState(null);

  // View Invoice modal
  const [viewInvoice, setViewInvoice] = useState(null);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getDashboard();
      setProfile(response.data.customer);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load customer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const openPayModal = (inv) => {
    setViewInvoice(null);
    setPayModalInvoice(inv);
  };

  const handlePrint = () => {
    window.print();
  };

  const kpi = stats?.kpi || {
    totalInvoices: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  };

  return (
    <ErpLayout title="Customer Portal" subtitle="Your Urban Furniture Account & Orders">
      {/* Welcome */}
      <div className="dashboard-welcome" style={{ marginBottom: '24px' }}>
        <div className="welcome-text">
          <h2>Welcome back, {user?.name || profile?.name || 'Customer'}</h2>
          <p>Review your furniture invoices, pending balances, and settlement receipts</p>
        </div>
        <div className="customer-id-badge">
          <span className="customer-id-label">CUSTOMER ID</span>
          <span className="customer-id-value">{profile?.customerCode || '—'}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <div className="kpi-icon-box blue">🛍️</div>
          <div className="kpi-details">
            <span className="kpi-label">My Sales Orders</span>
            <span className="kpi-val">{kpi.totalOrders || 0}</span>
          </div>
        </div>
        <div className="erp-kpi-card">
          <div className="kpi-icon-box blue">🧾</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Invoices</span>
            <span className="kpi-val">{kpi.totalInvoices}</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box amber">⏳</div>
          <div className="kpi-details">
            <span className="kpi-label">Pending Balance</span>
            <span className="kpi-val" style={{ color: 'var(--error)' }}>
              {formatCurrency(kpi.pendingAmount)}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="kpi-icon-box green">✓</div>
          <div className="kpi-details">
            <span className="kpi-label">Settled / Paid Amount</span>
            <span className="kpi-val" style={{ color: 'var(--success)' }}>
              {formatCurrency(kpi.paidAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="erp-card-table" style={{ marginBottom: '24px' }}>
        <div className="erp-table-header"><h3>My Sales Orders ({stats?.recentOrders?.length || 0})</h3></div>
        <div className="erp-table-scroll">
          {stats?.recentOrders?.length ? (
            <table className="erp-table"><thead><tr><th>Order Number</th><th>Date</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th></tr></thead><tbody>
              {stats.recentOrders.map((order) => <tr key={order.id}><td><span className="customer-code">{order.orderNumber}</span></td><td>{formatDate(order.date)}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(order.total)}</td><td><span className="badge badge-admin">{order.status}</span></td></tr>)}
            </tbody></table>
          ) : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sales orders yet.</div>}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>My Invoices</h3>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CUSTOMER_INVOICES)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            All Invoices →
          </button>
        </div>
        <div className="erp-table-scroll">
          {stats?.recentInvoices?.length > 0 ? (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ textAlign: 'right' }}>Paid (₹)</th>
                  <th style={{ textAlign: 'right' }}>Balance Due (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((inv) => {
                  const balance = Math.max(0, inv.total - inv.paidAmount);
                  return (
                    <tr key={inv.id}>
                      <td><span className="customer-code">{inv.invoiceNumber}</span></td>
                      <td>{formatDate(inv.date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(inv.paidAmount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: balance > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {formatCurrency(balance)}
                      </td>
                      <td>
                        <span className={`badge ${inv.status === 'PAID' ? 'badge-active' : inv.status === 'PARTIALLY_PAID' ? 'badge-sales' : 'badge-warning'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setViewInvoice(inv)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            👁️ View
                          </button>
                          {balance > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPayModal(inv)}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                            >
                              💳 Pay Now
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>
                              ✓ Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              You have no invoices yet.
            </div>
          )}
        </div>
      </div>

      {/* ── View Invoice Modal ─────────────────────────────────── */}
      {viewInvoice && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card invoice-print-area" style={{ maxWidth: '750px' }}>
            <div className="modal-header no-print">
              <div>
                <h3>Invoice Details</h3>
                <p className="modal-subtitle">{viewInvoice.invoiceNumber} — {viewInvoice.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Printable Invoice Document */}
            <div className="printable-invoice">
              <div className="invoice-company-header">
                <div className="invoice-company-brand">
                  <div className="invoice-company-logo">UF</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Urban Furniture
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Premium Furniture Solutions
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                    INVOICE
                  </h1>
                  <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {viewInvoice.invoiceNumber}
                  </p>
                </div>
              </div>

              <div className="invoice-meta-grid">
                <div className="invoice-meta-section">
                  <h4>Billed To</h4>
                  <p className="invoice-meta-value">{viewInvoice.customer?.name || '—'}</p>
                  {viewInvoice.customer?.email && <p className="invoice-meta-sub">{viewInvoice.customer.email}</p>}
                  {viewInvoice.customer?.mobile && <p className="invoice-meta-sub">{viewInvoice.customer.mobile}</p>}
                </div>
                <div className="invoice-meta-section" style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h4>Invoice Date</h4>
                    <p className="invoice-meta-value">{formatDate(viewInvoice.date)}</p>
                  </div>
                  <div>
                    <h4>Due Date</h4>
                    <p className="invoice-meta-value">{viewInvoice.dueDate ? formatDate(viewInvoice.dueDate) : 'Net 30'}</p>
                  </div>
                </div>
              </div>

              <table className="erp-table invoice-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Item / Description</th>
                    <th style={{ textAlign: 'center', width: '70px' }}>Qty</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', width: '80px' }}>Tax %</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <strong>{it.product?.name || it.description}</strong>
                        {it.product?.name && it.description && it.description !== it.product.name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.description}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{it.taxRate || 0}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals-box">
                <div className="invoice-total-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(viewInvoice.subtotal)}</strong>
                </div>
                <div className="invoice-total-row">
                  <span>Tax (GST)</span>
                  <strong>{formatCurrency(viewInvoice.tax)}</strong>
                </div>
                <div className="invoice-total-row invoice-grand-total">
                  <span>Total Amount</span>
                  <span>{formatCurrency(viewInvoice.total)}</span>
                </div>
                <div className="invoice-total-row" style={{ color: '#2e7d32' }}>
                  <span>Amount Paid</span>
                  <strong>{formatCurrency(viewInvoice.paidAmount)}</strong>
                </div>
                <div className="invoice-total-row invoice-balance-due">
                  <span>Balance Due</span>
                  <span>{formatCurrency(Math.max(0, viewInvoice.total - viewInvoice.paidAmount))}</span>
                </div>
              </div>

              {viewInvoice.payments && viewInvoice.payments.length > 0 && (
                <div className="invoice-payment-history">
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                    Payment History
                  </h4>
                  <table className="erp-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Payment #</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewInvoice.payments.map((p) => (
                        <tr key={p.id}>
                          <td><span className="customer-code">{p.paymentNumber}</span></td>
                          <td>{formatDateTime(p.date)}</td>
                          <td><span className="badge badge-admin">{p.method}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="invoice-footer-note">
                <p>Thank you for your business with Urban Furniture.</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  This is a computer-generated invoice. For queries, contact accounts@urbanfurniture.com
                </p>
              </div>
            </div>

            <div className="modal-actions no-print">
              <button type="button" onClick={() => setViewInvoice(null)} className="btn btn-secondary">
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print / Download PDF
              </button>
              {viewInvoice.status !== 'PAID' && (
                <button type="button" onClick={() => openPayModal(viewInvoice)} className="btn btn-primary">
                  💳 Pay Now →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {payModalInvoice && (
        <CustomerSandboxPayment
          invoice={payModalInvoice}
          customer={profile}
          onClose={() => setPayModalInvoice(null)}
          onSuccess={fetchCustomerData}
        />
      )}
    </ErpLayout>
  );
};

export default CustomerDashboard;
