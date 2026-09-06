import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { ROUTES } from '../../../utils/constants';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const VendorBillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Modal
  const [paymentModalBill, setPaymentModalBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await erpApi.getVendorBills();
      setBills(res.data.bills || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openPaymentModal = (bill) => {
    openSandboxPayment(bill);
  };

  const openSandboxPayment = (bill) => {
    navigate(ROUTES.PAYMENTS, { state: { vendorBillId: bill.id } });
  };

  const handleRecordDisbursement = async (e) => {
    e.preventDefault();
    setPaying(true);
    setPaymentError('');
    try {
      await erpApi.recordPayment({
        paymentType: 'OUTBOUND',
        method: paymentMethod,
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        reference: paymentRef,
        notes,
        vendorBillId: paymentModalBill.id,
      });

      setActionSuccess(`Payment to supplier recorded for ${paymentModalBill.billNumber}! Status updated to PAID.`);
      setPaymentModalBill(null);
      setTimeout(() => setActionSuccess(''), 5000);
      fetchBills();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record disbursement.');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = (bill) => {
    setSelectedBill(bill);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Real Database Summary Metrics
  const totalBillsCount = bills.length;
  const totalBilledAmount = bills.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPaidAmount = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingBillsAmount = Math.max(0, totalBilledAmount - totalPaidAmount);

  const now = new Date();
  const overdueCount = bills.filter(
    (b) => b.status !== 'PAID' && b.dueDate && new Date(b.dueDate) < now
  ).length;

  const filteredBills = statusFilter === 'ALL'
    ? bills
    : bills.filter((b) => b.status === statusFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-active" style={{ background: '#e8f5e9', color: '#2e7d32' }}>PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-sales" style={{ background: '#e3f2fd', color: '#1565c0' }}>PARTIAL</span>;
      default:
        return <span className="badge badge-warning" style={{ background: '#ffebee', color: '#c62828' }}>UNPAID</span>;
    }
  };

  return (
    <ErpLayout title="Vendor Bills" subtitle="Vendor Accounting Document Style">
      {/* Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Vendor Bills</h2>
          <p className="subtitle">Manage accounts payable, supplier obligations, and disbursement settlements.</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      {/* Top 4 Summary Cards (Mandatory from Database) */}
      <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #3b6e8c' }}>
          <div className="kpi-icon-box blue">📑</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Bills</span>
            <span className="kpi-val" style={{ color: '#3b6e8c' }}>{formatCurrency(totalBilledAmount)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
          <div className="kpi-icon-box green">✓</div>
          <div className="kpi-details">
            <span className="kpi-label">Paid to Vendors</span>
            <span className="kpi-val" style={{ color: '#2e7d32' }}>{formatCurrency(totalPaidAmount)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
          <div className="kpi-icon-box amber">⏳</div>
          <div className="kpi-details">
            <span className="kpi-label">Pending Payables</span>
            <span className="kpi-val" style={{ color: '#f57c00' }}>{formatCurrency(pendingBillsAmount)}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #c0392b' }}>
          <div className="kpi-icon-box gold">⚠️</div>
          <div className="kpi-details">
            <span className="kpi-label">Overdue Bills</span>
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
            {st === 'ALL' ? `All Bills (${bills.length})` : `${st.replace('_', ' ')} (${bills.filter(b => b.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Vendor Bills Document Table */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Supplier Bills & Invoices Received ({filteredBills.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading vendor bills...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">📑</div>
              <h3>No vendor bills registered</h3>
              <p>Bills are generated after marking incoming goods as received in Purchase Orders.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Bill Number</th>
                  <th>Vendor</th>
                  <th style={{ width: '110px' }}>Invoice Date</th>
                  <th style={{ width: '110px' }}>Due Date</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Amount</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Disbursed</th>
                  <th style={{ width: '130px' }}>Payment Status</th>
                  <th style={{ textAlign: 'right', width: '230px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{b.billNumber}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{b.vendor?.name || '—'}</strong>
                      {b.vendor?.city && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.vendor.city}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(b.date)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {b.dueDate ? formatDate(b.dueDate) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#d32f2f' }}>
                      {formatCurrency(b.total)}
                    </td>
                    <td style={{ textAlign: 'right', color: b.paidAmount > 0 ? '#2e7d32' : 'var(--text-muted)' }}>
                      {formatCurrency(b.paidAmount)}
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBill(b)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          👁️ View
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(b)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          🖨️ Print
                        </button>
                        {b.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => openSandboxPayment(b)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#d32f2f' }}
                          >
                            💳 Record Payment
                          </button>
                        )}
                        {b.status === 'PAID' && (
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

      {/* View Bill Modal */}
      {selectedBill && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div>
                <h3>Vendor Bill Document</h3>
                <p className="modal-subtitle">{selectedBill.billNumber} — {selectedBill.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Vendor:</strong> {selectedBill.vendor?.name}</div>
                <div><strong>Invoice Date:</strong> {formatDate(selectedBill.date)}</div>
                <div><strong>Due Date:</strong> {selectedBill.dueDate ? formatDate(selectedBill.dueDate) : 'Net 30'}</div>
                <div><strong>Purchase Order:</strong> {selectedBill.purchaseOrder?.orderNumber || 'PO-Linked'}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Billed Materials:</h4>
            <table className="erp-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Item / Material</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items?.map((it, idx) => (
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
                <strong>{formatCurrency(selectedBill.subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span>Tax:</span>
                <strong>{formatCurrency(selectedBill.tax)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: '#d32f2f' }}>
                <span>Total Bill Amount:</span>
                <span>{formatCurrency(selectedBill.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#2e7d32', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                <span>Amount Paid:</span>
                <span>{formatCurrency(selectedBill.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#c0392b', marginTop: '4px' }}>
                <span>Outstanding Payable:</span>
                <span>{formatCurrency(Math.max(0, selectedBill.total - selectedBill.paidAmount))}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
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
              {selectedBill.status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    const bill = selectedBill;
                    setSelectedBill(null);
                    openSandboxPayment(bill);
                  }}
                  className="btn btn-primary"
                  style={{ background: '#d32f2f' }}
                >
                  Record Payment →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Vendor Payment Modal (Simulated Demo Action) */}
      {paymentModalBill && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3>Record Supplier Payment</h3>
                <p className="modal-subtitle">
                  Bill {paymentModalBill.billNumber} — {paymentModalBill.vendor?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalBill(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Clear Demonstration Notice */}
            <div style={{
              background: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              color: '#1b5e20',
              fontSize: '0.82rem',
            }}>
              <strong>💡 Payment Simulation Flow:</strong> This records bank disbursement in general ledger accounts and marks the vendor bill as settled. No external bank transfer is executed.
            </div>

            {paymentError && <div className="alert alert-error mb-4">{paymentError}</div>}

            <form onSubmit={handleRecordDisbursement}>
              <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Bill Total:</span>
                  <strong>{formatCurrency(paymentModalBill.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Already Paid:</span>
                  <span style={{ color: '#2e7d32' }}>{formatCurrency(paymentModalBill.paidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#c0392b' }}>
                  <span>Outstanding Balance:</span>
                  <span>{formatCurrency(Math.max(0, paymentModalBill.total - paymentModalBill.paidAmount))}</span>
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
                    <option value="BANK">BANK (Commercial Account Transfer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Disbursement Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={paymentModalBill.total - paymentModalBill.paidAmount}
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
                  <label className="form-label">Disbursement Reference</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. DISB-BILL-0001"
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
                  placeholder="Supplier settlement details"
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setPaymentModalBill(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="btn btn-primary"
                  style={{ background: '#d32f2f' }}
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

export default VendorBillsPage;

