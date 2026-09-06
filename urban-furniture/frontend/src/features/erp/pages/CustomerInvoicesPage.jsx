import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const CustomerInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await erpApi.getCustomerInvoices();
      setInvoices(res.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv) => {
    const remaining = Math.max(0, inv.total - inv.paidAmount);
    setPaymentModalInvoice(inv);
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod('CASH');
    setPaymentRef(`REC-${inv.invoiceNumber}`);
    setNotes('');
    setPaymentError('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    setPaymentError('');
    try {
      await erpApi.recordPayment({
        paymentType: 'INBOUND',
        method: paymentMethod,
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        reference: paymentRef,
        notes,
        customerInvoiceId: paymentModalInvoice.id,
      });

      setActionSuccess(`Payment recorded successfully for ${paymentModalInvoice.invoiceNumber}! Status updated to PAID.`);
      setPaymentModalInvoice(null);
      setTimeout(() => setActionSuccess(''), 5000);
      fetchInvoices();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = (inv) => {
    setSelectedInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Real Database KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = Math.max(0, totalInvoiced - totalPaid);

  const now = new Date();
  const overdueCount = invoices.filter(
    (inv) => inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now
  ).length;

  const filteredInvoices = statusFilter === 'ALL'
    ? invoices
    : invoices.filter((i) => i.status === statusFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-active" style={{ background: '#e8f5e9', color: '#2e7d32' }}>PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-sales" style={{ background: '#e3f2fd', color: '#1565c0' }}>PARTIAL</span>;
      case 'DRAFT':
        return <span className="badge badge-admin" style={{ background: '#f5f5f5', color: '#616161' }}>DRAFT</span>;
      default:
        return <span className="badge badge-warning" style={{ background: '#fff3e0', color: '#e65100' }}>UNPAID</span>;
    }
  };

  return (
    <ErpLayout title="Customer Invoices" subtitle="Invoice / Payment Workspace">
      {/* Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Customer Invoices</h2>
          <p className="subtitle">Track billing, outstanding balances, and record payment settlements.</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      {/* Top 4 Summary Cards from Real Database Data */}
      <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
          <div className="kpi-icon-box blue">🧾</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Invoiced</span>
            <span className="kpi-val" style={{ color: '#1e88e5' }}>{formatCurrency(totalInvoiced)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
          <div className="kpi-icon-box green">✓</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Paid</span>
            <span className="kpi-val" style={{ color: '#2e7d32' }}>{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
          <div className="kpi-icon-box amber">⏳</div>
          <div className="kpi-details">
            <span className="kpi-label">Pending Balance</span>
            <span className="kpi-val" style={{ color: '#f57c00' }}>{formatCurrency(totalPending)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #c0392b' }}>
          <div className="kpi-icon-box gold">⚠️</div>
          <div className="kpi-details">
            <span className="kpi-label">Overdue Invoices</span>
            <span className="kpi-val" style={{ color: '#c0392b' }}>{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            {st === 'ALL' ? `All Invoices (${invoices.length})` : `${st.replace('_', ' ')} (${invoices.filter(i => i.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Invoice Workspace Table */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Customer Invoices ({filteredInvoices.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">🧾</div>
              <h3>No invoices found</h3>
              <p>Invoices are generated from confirmed Sales Orders in the Sales Orders module.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Invoice #</th>
                  <th>Customer</th>
                  <th style={{ width: '110px' }}>Invoice Date</th>
                  <th style={{ width: '110px' }}>Due Date</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Amount</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Paid</th>
                  <th style={{ width: '130px' }}>Payment Status</th>
                  <th style={{ textAlign: 'right', width: '230px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{inv.invoiceNumber}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{inv.customer?.name || '—'}</strong>
                      {inv.customer?.email && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.customer.email}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(inv.date)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td style={{ textAlign: 'right', color: inv.paidAmount > 0 ? '#2e7d32' : 'var(--text-muted)' }}>
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          👁️ View
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(inv)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          🖨️ Print
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(inv)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            💳 Record Payment
                          </button>
                        )}
                        {inv.status === 'PAID' && (
                          <span style={{ fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600, paddingRight: '6px' }}>
                            ✓ Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View/Print Invoice Modal */}
      {selectedInvoice && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div>
                <h3>Customer Invoice Document</h3>
                <p className="modal-subtitle">{selectedInvoice.invoiceNumber} — {selectedInvoice.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Billed To:</strong> {selectedInvoice.customer?.name}</div>
                <div><strong>Invoice Date:</strong> {formatDate(selectedInvoice.date)}</div>
                <div><strong>Due Date:</strong> {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : 'Net 30'}</div>
                <div><strong>Sales Order:</strong> {selectedInvoice.salesOrder?.orderNumber || 'SO-Linked'}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Invoice Line Items:</h4>
            <table className="erp-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Item / Description</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product?.name || it.description}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'var(--bg-primary)', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span>Subtotal:</span>
                <strong>{formatCurrency(selectedInvoice.subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span>Tax:</span>
                <strong>{formatCurrency(selectedInvoice.tax)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#2e7d32', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                <span>Paid Amount:</span>
                <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#c0392b', marginTop: '4px' }}>
                <span>Balance Due:</span>
                <span>{formatCurrency(Math.max(0, selectedInvoice.total - selectedInvoice.paidAmount))}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
              >
                🖨️ Print
              </button>
              {selectedInvoice.status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    openPaymentModal(inv);
                  }}
                  className="btn btn-primary"
                >
                  Record Payment →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal (Demonstration Simulation) */}
      {paymentModalInvoice && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3>Record Customer Payment</h3>
                <p className="modal-subtitle">
                  Invoice {paymentModalInvoice.invoiceNumber} — {paymentModalInvoice.customer?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Clear Demonstration / Recording Notice */}
            <div style={{
              background: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              color: '#1b5e20',
              fontSize: '0.82rem',
            }}>
              <strong>💡 Payment Simulation Flow:</strong> This records the accounting transaction, generates journal entries, and settles the customer invoice. No real banking gateway or money transfer is executed.
            </div>

            {paymentError && <div className="alert alert-error mb-4">{paymentError}</div>}

            <form onSubmit={handleRecordPayment}>
              <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Invoice Total:</span>
                  <strong>{formatCurrency(paymentModalInvoice.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Already Paid:</span>
                  <span style={{ color: '#2e7d32' }}>{formatCurrency(paymentModalInvoice.paidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#c0392b' }}>
                  <span>Outstanding Balance:</span>
                  <span>{formatCurrency(Math.max(0, paymentModalInvoice.total - paymentModalInvoice.paidAmount))}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-input"
                    style={{ height: '48px' }}
                    required
                  >
                    <option value="CASH">CASH (Physical Cash Register)</option>
                    <option value="BANK">BANK (Bank Account Transfer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={paymentModalInvoice.total - paymentModalInvoice.paidAmount}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Reference</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. REC-INV-0001"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Settlement notes"
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="btn btn-primary"
                >
                  {paying ? 'Recording...' : 'Record Payment Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default CustomerInvoicesPage;

