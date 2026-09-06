import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { customerApi } from '../../../services/authApi';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const PaymentsPage = () => {
  const { hasPermission } = useAuth();
  const canCustomerPay = hasPermission(PERMISSIONS.RECORD_CUSTOMER_PAYMENTS);
  const canVendorPay = hasPermission(PERMISSIONS.RECORD_VENDOR_PAYMENTS);

  const [activeTab, setActiveTab] = useState(() => (canCustomerPay ? 'CUSTOMER' : canVendorPay ? 'VENDOR' : 'CUSTOMER'));
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);

  // Customer Payment Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [customerPayAmount, setCustomerPayAmount] = useState('');
  const [customerPayMethod, setCustomerPayMethod] = useState('CASH');
  const [customerPayDate, setCustomerPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerPayRef, setCustomerPayRef] = useState('');
  const [customerPayNotes, setCustomerPayNotes] = useState('');

  // Vendor Payment Form
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [vendorPayAmount, setVendorPayAmount] = useState('');
  const [vendorPayMethod, setVendorPayMethod] = useState('BANK');
  const [vendorPayDate, setVendorPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorPayRef, setVendorPayRef] = useState('');
  const [vendorPayNotes, setVendorPayNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, vRes, iRes, bRes] = await Promise.all([
        erpApi.getPayments(),
        customerApi.getCustomers(),
        erpApi.getContacts({ type: 'VENDOR' }),
        erpApi.getCustomerInvoices(),
        erpApi.getVendorBills(),
      ]);

      setPayments(pRes.data.payments || []);
      const eligibleCustomers = (cRes.data.customers || [])
        .filter((customer) => customer.status === 'ACTIVE' && customer.contactId)
        .map((customer) => ({ ...customer, id: customer.contactId }));
      const eligibleVendors = (vRes.data.contacts || []).filter(
        (c) => c.type === 'VENDOR' || c.type === 'BOTH'
      );
      setCustomers(eligibleCustomers);
      setVendors(eligibleVendors);
      setInvoices(iRes.data.invoices || []);
      setBills(bRes.data.bills || []);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Customer Invoices available for selected customer
  const customerUnpaidInvoices = invoices.filter(
    (inv) => inv.customerId === selectedCustomerId && inv.status !== 'PAID'
  );

  const currentSelectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const customerOutstanding = currentSelectedInvoice
    ? Math.max(0, currentSelectedInvoice.total - currentSelectedInvoice.paidAmount)
    : 0;

  // Handle Customer Selection
  const handleCustomerChange = (cid) => {
    setSelectedCustomerId(cid);
    const unpaid = invoices.filter((i) => i.customerId === cid && i.status !== 'PAID');
    if (unpaid.length > 0) {
      setSelectedInvoiceId(unpaid[0].id);
      const rem = Math.max(0, unpaid[0].total - unpaid[0].paidAmount);
      setCustomerPayAmount(rem.toString());
      setCustomerPayRef(`REC-${unpaid[0].invoiceNumber}`);
    } else {
      setSelectedInvoiceId('');
      setCustomerPayAmount('');
      setCustomerPayRef('');
    }
  };

  // Handle Invoice Selection
  const handleInvoiceChange = (iid) => {
    setSelectedInvoiceId(iid);
    const inv = invoices.find((i) => i.id === iid);
    if (inv) {
      const rem = Math.max(0, inv.total - inv.paidAmount);
      setCustomerPayAmount(rem.toString());
      setCustomerPayRef(`REC-${inv.invoiceNumber}`);
    } else {
      setCustomerPayAmount('');
    }
  };

  // Vendor Bills available for selected vendor
  const vendorUnpaidBills = bills.filter(
    (b) => b.vendorId === selectedVendorId && b.status !== 'PAID'
  );

  const currentSelectedBill = bills.find((b) => b.id === selectedBillId);
  const vendorOutstanding = currentSelectedBill
    ? Math.max(0, currentSelectedBill.total - currentSelectedBill.paidAmount)
    : 0;

  // Handle Vendor Selection
  const handleVendorChange = (vid) => {
    setSelectedVendorId(vid);
    const unpaid = bills.filter((b) => b.vendorId === vid && b.status !== 'PAID');
    if (unpaid.length > 0) {
      setSelectedBillId(unpaid[0].id);
      const rem = Math.max(0, unpaid[0].total - unpaid[0].paidAmount);
      setVendorPayAmount(rem.toString());
      setVendorPayRef(`DISB-${unpaid[0].billNumber}`);
    } else {
      setSelectedBillId('');
      setVendorPayAmount('');
      setVendorPayRef('');
    }
  };

  // Handle Bill Selection
  const handleBillChange = (bid) => {
    setSelectedBillId(bid);
    const bill = bills.find((b) => b.id === bid);
    if (bill) {
      const rem = Math.max(0, bill.total - bill.paidAmount);
      setVendorPayAmount(rem.toString());
      setVendorPayRef(`DISB-${bill.billNumber}`);
    } else {
      setVendorPayAmount('');
    }
  };

  // Submit Customer Payment (Recording only)
  const handleRecordCustomerPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setActionSuccess('');
    setSuccessDetails(null);

    try {
      const payload = {
        paymentType: 'INBOUND',
        method: customerPayMethod,
        amount: parseFloat(customerPayAmount),
        date: customerPayDate,
        reference: customerPayRef || `PAY-REC-${Date.now()}`,
        notes: customerPayNotes || 'Customer payment recording',
        customerInvoiceId: selectedInvoiceId || undefined,
        contactId: selectedCustomerId,
      };

      const res = await erpApi.recordPayment(payload);
      setActionSuccess('Payment recorded successfully');
      setSuccessDetails({
        type: 'CUSTOMER',
        party: customers.find((c) => c.id === selectedCustomerId)?.name,
        document: currentSelectedInvoice?.invoiceNumber,
        amount: customerPayAmount,
        method: customerPayMethod,
        ref: payload.reference,
        status: 'PAID',
      });

      // Refresh data
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record customer payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Vendor Payment (Recording only)
  const handleRecordVendorPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setActionSuccess('');
    setSuccessDetails(null);

    try {
      const payload = {
        paymentType: 'OUTBOUND',
        method: vendorPayMethod,
        amount: parseFloat(vendorPayAmount),
        date: vendorPayDate,
        reference: vendorPayRef || `PAY-DISB-${Date.now()}`,
        notes: vendorPayNotes || 'Vendor disbursement recording',
        vendorBillId: selectedBillId || undefined,
        contactId: selectedVendorId,
      };

      const res = await erpApi.recordPayment(payload);
      setActionSuccess('Payment recorded successfully');
      setSuccessDetails({
        type: 'VENDOR',
        party: vendors.find((v) => v.id === selectedVendorId)?.name,
        document: currentSelectedBill?.billNumber,
        amount: vendorPayAmount,
        method: vendorPayMethod,
        ref: payload.reference,
        status: 'PAID',
      });

      // Refresh data
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record vendor payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErpLayout title="Payments" subtitle="Payment Register & Recording Simulation">
      {/* Page Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Payments</h2>
          <p className="subtitle">Record customer and vendor payments.</p>
        </div>
      </div>

      {/* Prominent Demo-Recording Notice */}
      <div
        style={{
          background: 'rgba(30, 136, 229, 0.08)',
          border: '1px solid rgba(30, 136, 229, 0.25)',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          <strong>ACCOUNTING DEMONSTRATION WORKFLOW:</strong> This screen records internal double-entry accounting transactions (Cash/Bank vs. Debtors/Creditors). <em>No real online money transfer or payment gateway is invoked.</em>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {formError && <div className="alert alert-error mb-4">{formError}</div>}

      {/* Success Confirmation Banner */}
      {actionSuccess && successDetails && (
        <div
          style={{
            background: '#e8f5e9',
            border: '2px solid #81c784',
            borderRadius: '10px',
            padding: '18px 24px',
            marginBottom: '24px',
            color: '#1b5e20',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
            <span>✅</span>
            <span>{actionSuccess}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
            <div><strong>Party:</strong> {successDetails.party}</div>
            <div><strong>Target Document:</strong> {successDetails.document}</div>
            <div><strong>Amount:</strong> {formatCurrency(parseFloat(successDetails.amount))}</div>
            <div><strong>Method:</strong> {successDetails.method}</div>
            <div><strong>Reference:</strong> <code>{successDetails.ref}</code></div>
            <div><strong>Updated Status:</strong> <span className="badge badge-active">{successDetails.status}</span></div>
          </div>
        </div>
      )}

      {/* Payment Type Selection Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {canCustomerPay && (
          <button
            type="button"
            onClick={() => { setActiveTab('CUSTOMER'); setFormError(''); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '10px',
              border: activeTab === 'CUSTOMER' ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: activeTab === 'CUSTOMER' ? 'var(--bg-card)' : 'var(--bg-primary)',
              color: activeTab === 'CUSTOMER' ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: activeTab === 'CUSTOMER' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <span>📥</span> CUSTOMER PAYMENT (Receipt from Customer)
          </button>
        )}

        {canVendorPay && (
          <button
            type="button"
            onClick={() => { setActiveTab('VENDOR'); setFormError(''); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '10px',
              border: activeTab === 'VENDOR' ? '2px solid #d32f2f' : '1px solid var(--border)',
              background: activeTab === 'VENDOR' ? 'var(--bg-card)' : 'var(--bg-primary)',
              color: activeTab === 'VENDOR' ? '#d32f2f' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: activeTab === 'VENDOR' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <span>📤</span> VENDOR PAYMENT (Disbursement to Vendor)
          </button>
        )}
      </div>

      {!canCustomerPay && !canVendorPay && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          🔒 You do not have permission to record customer or vendor payments. Contact your administrator to enable payment permissions.
        </div>
      )}

      {/* ========================================================
          TAB 1: CUSTOMER PAYMENT
          ======================================================== */}
      {activeTab === 'CUSTOMER' && (
        <div className="card" style={{ padding: '28px', marginBottom: '32px', borderTop: '4px solid var(--accent)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Record Customer Receipt
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Select a customer and open invoice to record cash or bank settlement
            </p>
          </div>

          <form onSubmit={handleRecordCustomerPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Customer (Contact Master) *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) {c.city ? `- ${c.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="">-- Select Unpaid Invoice --</option>
                  {customerUnpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — Total {formatCurrency(inv.total)} (Bal: {formatCurrency((inv.total - inv.paidAmount))})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outstanding Amount Highlight */}
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Balance on Invoice:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: customerOutstanding > 0 ? '#e65100' : '#2e7d32' }}>
                  {formatCurrency(customerOutstanding)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentSelectedInvoice ? (
                  <>Invoice Date: {formatDate(currentSelectedInvoice.date)} | Status: {currentSelectedInvoice.status}</>
                ) : (
                  'Please select an invoice'
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={customerPayAmount}
                  onChange={(e) => setCustomerPayAmount(e.target.value)}
                  placeholder="25000"
                  max={customerOutstanding > 0 ? customerOutstanding : undefined}
                  required
                  className="form-input"
                  style={{ height: '48px', fontSize: '1.05rem', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  value={customerPayMethod}
                  onChange={(e) => setCustomerPayMethod(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="CASH">CASH (Physical Cash Register)</option>
                  <option value="BANK">BANK (Commercial Bank Account)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  value={customerPayDate}
                  onChange={(e) => setCustomerPayDate(e.target.value)}
                  required
                  className="form-input"
                  style={{ height: '48px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reference *</label>
                <input
                  type="text"
                  value={customerPayRef}
                  onChange={(e) => setCustomerPayRef(e.target.value)}
                  placeholder="e.g. REC-INV-00001"
                  required
                  className="form-input"
                  style={{ height: '48px' }}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Notes</label>
              <input
                type="text"
                value={customerPayNotes}
                onChange={(e) => setCustomerPayNotes(e.target.value)}
                placeholder="e.g. Received full settlement for Office Chairs"
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting || !selectedInvoiceId || customerOutstanding <= 0}
                className="btn btn-primary"
                style={{ height: '48px', padding: '0 28px', fontSize: '0.95rem' }}
              >
                {submitting ? 'Recording Settlement...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 2: VENDOR PAYMENT
          ======================================================== */}
      {activeTab === 'VENDOR' && (
        <div className="card" style={{ padding: '28px', marginBottom: '32px', borderTop: '4px solid #d32f2f' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Record Vendor Disbursement
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Select a vendor and unpaid bill to record bank disbursement
            </p>
          </div>

          <form onSubmit={handleRecordVendorPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Vendor (Contact Master) *</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type}) {v.city ? `- ${v.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vendor Bill *</label>
                <select
                  value={selectedBillId}
                  onChange={(e) => handleBillChange(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="">-- Select Unpaid Vendor Bill --</option>
                  {vendorUnpaidBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} — Total {formatCurrency(b.total)} (Bal: {formatCurrency((b.total - b.paidAmount))})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outstanding Amount Highlight */}
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Payable to Vendor:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: vendorOutstanding > 0 ? '#d32f2f' : '#2e7d32' }}>
                  {formatCurrency(vendorOutstanding)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentSelectedBill ? (
                  <>Bill Date: {formatDate(currentSelectedBill.date)} | Status: {currentSelectedBill.status}</>
                ) : (
                  'Please select a vendor bill'
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={vendorPayAmount}
                  onChange={(e) => setVendorPayAmount(e.target.value)}
                  placeholder="60000"
                  max={vendorOutstanding > 0 ? vendorOutstanding : undefined}
                  required
                  className="form-input"
                  style={{ height: '48px', fontSize: '1.05rem', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  value={vendorPayMethod}
                  onChange={(e) => setVendorPayMethod(e.target.value)}
                  className="form-input"
                  style={{ height: '48px' }}
                  required
                >
                  <option value="BANK">BANK (Commercial Account Disbursement)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  value={vendorPayDate}
                  onChange={(e) => setVendorPayDate(e.target.value)}
                  required
                  className="form-input"
                  style={{ height: '48px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reference *</label>
                <input
                  type="text"
                  value={vendorPayRef}
                  onChange={(e) => setVendorPayRef(e.target.value)}
                  placeholder="e.g. DISB-BILL-00001"
                  required
                  className="form-input"
                  style={{ height: '48px' }}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Notes</label>
              <input
                type="text"
                value={vendorPayNotes}
                onChange={(e) => setVendorPayNotes(e.target.value)}
                placeholder="e.g. Disbursement for Wooden Chairs procurement"
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting || !selectedBillId || vendorOutstanding <= 0}
                className="btn btn-primary"
                style={{ height: '48px', padding: '0 28px', fontSize: '0.95rem', background: '#d32f2f' }}
              >
                {submitting ? 'Recording Disbursement...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          PAYMENTS REGISTER TABLE
          ======================================================== */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Payment Register ({payments.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading payment register...
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">💳</div>
              <h3>No payments recorded yet</h3>
              <p>Record a customer receipt or vendor disbursement above.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Payment #</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th>Party (Customer / Vendor)</th>
                  <th style={{ width: '130px' }}>Flow</th>
                  <th style={{ width: '100px' }}>Method</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Amount</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{p.paymentNumber}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(p.date)}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.contact?.name || '—'}</strong>
                      {p.customerInvoice && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Linked: {p.customerInvoice.invoiceNumber}
                        </div>
                      )}
                      {p.vendorBill && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Linked: {p.vendorBill.billNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.paymentType === 'INBOUND' ? 'badge-active' : 'badge-purchase'}`}>
                        {p.paymentType === 'INBOUND' ? '📥 RECEIPT' : '📤 DISBURSEMENT'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-admin" style={{ fontWeight: 600 }}>{p.method}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {p.reference || '—'}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: p.paymentType === 'INBOUND' ? '#2e7d32' : '#d32f2f',
                    }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-active">RECORDED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ErpLayout>
  );
};

export default PaymentsPage;

