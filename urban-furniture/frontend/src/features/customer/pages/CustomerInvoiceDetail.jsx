import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import { StatusBadge, ErrorBox } from '../components/CustomerUI';
import PaymentModal from '../components/PaymentModal';
import customerApi from '../../../services/customerApi';
import { ROUTES } from '../../../utils/constants';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const THEME_KEY = 'cp_theme';

const CustomerInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.getInvoiceById(id);
      setInvoice(res.data.invoice);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Access denied. This invoice does not belong to your account.');
      } else if (e.response?.status === 404) {
        setError('Invoice not found.');
      } else {
        setError(e.response?.data?.message || 'Failed to load invoice.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  if (loading) {
    return (
      <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
        <div className="cp-layout">
          <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="cp-main">
            <CustomerHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} theme={theme} onToggleTheme={toggleTheme} />
            <main className="cp-page">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map((i) => <div key={i} className="cp-skeleton" style={{ height: 40, borderRadius: 8 }} />)}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="cp-main">
          <CustomerHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} theme={theme} onToggleTheme={toggleTheme} />

          <main className="cp-page" id="cp-invoice-detail-page">
            <div className="cp-page-header">
              <h1 className="cp-page-title">
                Invoice — {invoice?.invoiceNumber || '—'}
              </h1>
              <button
                className="cp-btn cp-btn-outline"
                onClick={() => navigate(ROUTES.CUSTOMER_INVOICES)}
                id="cp-back-to-invoices"
              >
                ← Back to Invoices
              </button>
            </div>

            {error && <ErrorBox message={error} />}
            {successMsg && <div className="cp-alert success">✅ {successMsg}</div>}

            {invoice && (
              <>
                {/* Invoice Header */}
                <div className="cp-section-card" style={{ marginBottom: 16 }}>
                  <div className="cp-modal-header" style={{ borderRadius: 0 }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--cp-text-primary)' }}>
                        Urban Furniture
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--cp-text-muted)' }}>
                        Tax Invoice
                      </div>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>

                  <div className="cp-modal-body">
                    <div className="cp-inv-detail-grid">
                      <div className="cp-inv-info-box">
                        <div className="cp-inv-info-label">Invoice Number</div>
                        <div className="cp-inv-info-val">{invoice.invoiceNumber}</div>
                      </div>
                      <div className="cp-inv-info-box">
                        <div className="cp-inv-info-label">Invoice Date</div>
                        <div className="cp-inv-info-val">{fmtDate(invoice.invoiceDate)}</div>
                      </div>
                      <div className="cp-inv-info-box">
                        <div className="cp-inv-info-label">Due Date</div>
                        <div className="cp-inv-info-val">{fmtDate(invoice.dueDate)}</div>
                      </div>
                      <div className="cp-inv-info-box">
                        <div className="cp-inv-info-label">Customer</div>
                        <div className="cp-inv-info-val">{invoice.customer?.user?.name || '—'}</div>
                      </div>
                      {invoice.customer?.user?.email && (
                        <div className="cp-inv-info-box">
                          <div className="cp-inv-info-label">Email</div>
                          <div className="cp-inv-info-val">{invoice.customer.user.email}</div>
                        </div>
                      )}
                      {invoice.customer?.address && (
                        <div className="cp-inv-info-box">
                          <div className="cp-inv-info-label">Address</div>
                          <div className="cp-inv-info-val">{invoice.customer.address}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="cp-section-card" style={{ marginBottom: 16 }}>
                  <div className="cp-section-header">
                    <h2 className="cp-section-title">Invoice Items</h2>
                  </div>
                  <div className="cp-table-wrap">
                    <table className="cp-table" aria-label="Invoice line items">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Tax %</th>
                          <th>Tax Amt</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoice.invoiceItems || []).map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 500, color: 'var(--cp-text-primary)' }}>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{fmt(item.unitPrice)}</td>
                            <td>{item.taxPercent}%</td>
                            <td>{fmt(item.taxAmount)}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 32, fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--cp-text-muted)' }}>Subtotal</span>
                      <span style={{ fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{fmt(invoice.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 32, fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--cp-text-muted)' }}>Tax</span>
                      <span style={{ fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{fmt(invoice.taxAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 32, fontSize: '1rem', borderTop: '1px solid var(--cp-border)', paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--cp-text-primary)' }}>Total Amount</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--cp-text-primary)', minWidth: 100, textAlign: 'right' }}>{fmt(invoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="cp-section-card" style={{ marginBottom: 16 }}>
                  <div className="cp-section-header">
                    <h2 className="cp-section-title">Payment Summary</h2>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div className="cp-inv-info-box">
                      <div className="cp-inv-info-label">Total Amount</div>
                      <div className="cp-inv-info-val">{fmt(invoice.totalAmount)}</div>
                    </div>
                    <div className="cp-inv-info-box" style={{ background: 'var(--cp-green-pale)' }}>
                      <div className="cp-inv-info-label" style={{ color: 'var(--cp-green)' }}>Paid Amount</div>
                      <div className="cp-inv-info-val" style={{ color: 'var(--cp-green)' }}>{fmt(invoice.paidAmount)}</div>
                    </div>
                    <div className="cp-inv-info-box" style={{ background: invoice.outstanding > 0 ? 'var(--cp-red-pale)' : 'var(--cp-green-pale)' }}>
                      <div className="cp-inv-info-label" style={{ color: invoice.outstanding > 0 ? 'var(--cp-red)' : 'var(--cp-green)' }}>Outstanding</div>
                      <div className="cp-inv-info-val" style={{ color: invoice.outstanding > 0 ? 'var(--cp-red)' : 'var(--cp-green)' }}>{fmt(invoice.outstanding)}</div>
                    </div>
                  </div>

                  {/* Payment History */}
                  {invoice.payments && invoice.payments.length > 0 && (
                    <>
                      <div className="cp-section-header" style={{ borderTop: '1px solid var(--cp-border)' }}>
                        <h3 className="cp-section-title" style={{ fontSize: '0.88rem' }}>Payment History</h3>
                      </div>
                      <div className="cp-table-wrap">
                        <table className="cp-table">
                          <thead>
                            <tr>
                              <th>Payment ID</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.payments.map((p) => (
                              <tr key={p.id}>
                                <td style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{p.paymentNumber}</td>
                                <td>{fmtDate(p.paidAt)}</td>
                                <td style={{ fontWeight: 600, color: 'var(--cp-green)' }}>{fmt(p.amount)}</td>
                                <td><StatusBadge status={p.method} /></td>
                                <td><StatusBadge status={p.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* EMI Plans */}
                  {invoice.emiPlans && invoice.emiPlans.length > 0 && (
                    <>
                      <div className="cp-section-header" style={{ borderTop: '1px solid var(--cp-border)' }}>
                        <h3 className="cp-section-title" style={{ fontSize: '0.88rem' }}>EMI Plan</h3>
                        <StatusBadge status={invoice.emiPlans[0].status} />
                      </div>
                      <div style={{ padding: '12px 20px' }}>
                        {invoice.emiPlans[0].installments?.map((inst) => (
                          <div key={inst.id} className="cp-emi-row">
                            <span className="cp-emi-row-label">Installment #{inst.installmentNo} — {fmtDate(inst.dueDate)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="cp-emi-row-val">{fmt(inst.amount)}</span>
                              {inst.isPaid
                                ? <span className="cp-badge paid">Paid</span>
                                : <span className="cp-badge pending">Due</span>
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                    <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
                      <button
                        className="cp-btn cp-btn-primary"
                        onClick={() => setPayOpen(true)}
                        id="cp-pay-now-detail-btn"
                      >
                        💳 Pay Now
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          <footer className="cp-footer">
            <span>© 2025 Urban Furniture. All rights reserved.</span>
            <div className="cp-footer-links">
              <span className="cp-footer-link">Privacy</span>
              <span className="cp-footer-link">Terms</span>
              <span className="cp-footer-link">Support</span>
            </div>
          </footer>
        </div>
        <button
          className="cp-sidebar-toggle"
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Open navigation"
          id="cp-mobile-menu-detail"
          style={{ display: 'flex' }}
        >☰</button>
      </div>

      {payOpen && invoice && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setPayOpen(false)}
          onPaymentSuccess={() => {
            setSuccessMsg('Payment recorded!');
            setPayOpen(false);
            fetchInvoice();
            setTimeout(() => setSuccessMsg(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default CustomerInvoiceDetail;
