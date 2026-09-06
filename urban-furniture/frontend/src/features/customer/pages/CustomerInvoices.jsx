import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import { customerApi } from '../../../services/authApi';
import { formatDate, formatDateTime, formatCurrency } from '../../../utils/formatters';
import CustomerSandboxPayment from '../components/CustomerSandboxPayment';

const CustomerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // View Invoice Modal
  const [viewInvoice, setViewInvoice] = useState(null);

  // Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getInvoices();
      setInvoices(res.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv) => {
    setViewInvoice(null);
    setPaymentModalInvoice(inv);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ErpLayout title="My Invoices" subtitle="View and Settle Your Furniture Orders">
      <div className="customer-dir-title-row">
        <div>
          <h2>My Invoices</h2>
          <p className="subtitle">All invoices issued to your registered customer account</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Your Invoices ({invoices.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">🧾</div>
              <h3>No invoices found</h3>
              <p>No billing invoices are currently issued for your customer account.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Balance Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const balance = Math.max(0, inv.total - inv.paidAmount);
                  return (
                    <tr key={inv.id}>
                      <td><span className="customer-code">{inv.invoiceNumber}</span></td>
                      <td>{formatDate(inv.date)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {inv.dueDate ? formatDate(inv.dueDate) : 'Net 30'}
                      </td>
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
                            👁️ View Invoice
                          </button>
                          {balance > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(inv)}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                            >
                              💳 Pay Now
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>
                              ✓ Fully Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

            {/* ── Printable Invoice Document ─────────────────── */}
            <div className="printable-invoice">
              {/* Company Header */}
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

              {/* Invoice Meta Grid */}
              <div className="invoice-meta-grid">
                <div className="invoice-meta-section">
                  <h4>Billed To</h4>
                  <p className="invoice-meta-value">{viewInvoice.customer?.name || '—'}</p>
                  {viewInvoice.customer?.email && (
                    <p className="invoice-meta-sub">{viewInvoice.customer.email}</p>
                  )}
                  {viewInvoice.customer?.mobile && (
                    <p className="invoice-meta-sub">{viewInvoice.customer.mobile}</p>
                  )}
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

              {/* Line Items Table */}
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

              {/* Totals Summary */}
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

              {/* Payment History */}
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
                        <th>Reference</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewInvoice.payments.map((p) => (
                        <tr key={p.id}>
                          <td><span className="customer-code">{p.paymentNumber}</span></td>
                          <td>{formatDateTime(p.date)}</td>
                          <td><span className="badge badge-admin">{p.method}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.reference || '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invoice Footer */}
              <div className="invoice-footer-note">
                <p>Thank you for your business with Urban Furniture.</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  This is a computer-generated invoice. For queries, contact accounts@urbanfurniture.com
                </p>
              </div>
            </div>

            {/* Action Buttons (hidden in print) */}
            <div className="modal-actions no-print">
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="btn btn-secondary"
              >
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
                <button
                  type="button"
                  onClick={() => openPaymentModal(viewInvoice)}
                  className="btn btn-primary"
                >
                  💳 Pay Now →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentModalInvoice && (
        <CustomerSandboxPayment
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={() => {
            setActionSuccess('Payment recorded successfully! Invoice status updated.');
            setTimeout(() => setActionSuccess(''), 5000);
            fetchInvoices();
          }}
        />
      )}
    </ErpLayout>
  );
};

export default CustomerInvoices;
