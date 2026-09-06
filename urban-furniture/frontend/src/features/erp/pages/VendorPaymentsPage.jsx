import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';

const today = () => new Date().toISOString().slice(0, 10);
const steps = ['Select Method', 'Enter Details', 'Review', 'Payment Result'];

const VendorPaymentsPage = () => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const canRecord = hasPermission(PERMISSIONS.RECORD_VENDOR_PAYMENTS);
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [showFlow, setShowFlow] = useState(false);
  const [step, setStep] = useState(0);
  const [flowError, setFlowError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form, setForm] = useState({ vendorId: '', billId: '', method: 'BANK', amount: '', date: today(), reference: '', notes: '' });
  const [testDetails, setTestDetails] = useState({ accountHolder: 'Urban Furniture Pvt Ltd', bankName: 'HDFC Bank (Sandbox)', accountNumber: 'TEST-ACCOUNT-001', ifsc: 'TEST0001234', upiId: 'test@upi', cardNumber: '4111 1111 1111 1111', expiry: '12/30', cashReference: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentResponse, vendorResponse, billResponse] = await Promise.all([
        erpApi.getPayments({ paymentType: 'OUTBOUND' }),
        erpApi.getContacts({ type: 'VENDOR' }),
        erpApi.getVendorBills(),
      ]);
      setPayments(paymentResponse.data.payments || []);
      setVendors((vendorResponse.data.contacts || []).filter((vendor) => vendor.type === 'VENDOR' || vendor.type === 'BOTH'));
      setBills(billResponse.data.bills || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load vendor payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [payment.paymentNumber, payment.reference, payment.contact?.name, payment.vendorBill?.billNumber].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesVendor = vendorFilter === 'ALL' || payment.contactId === vendorFilter;
    const matchesMethod = methodFilter === 'ALL' || payment.method === methodFilter;
    const matchesDate = dateFilter === 'ALL' || String(payment.date || '').slice(0, 10) === dateFilter;
    return matchesSearch && matchesVendor && matchesMethod && matchesDate;
  }), [payments, search, vendorFilter, methodFilter, dateFilter]);

  const outstandingBills = bills.filter((bill) => bill.status !== 'PAID');
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingPayables = outstandingBills.reduce((sum, bill) => sum + Math.max(0, Number(bill.total || 0) - Number(bill.paidAmount || 0)), 0);
  const selectedVendor = vendors.find((vendor) => vendor.id === form.vendorId);
  const vendorBills = outstandingBills.filter((bill) => bill.vendorId === form.vendorId);
  const selectedBill = bills.find((bill) => bill.id === form.billId);
  const billOutstanding = selectedBill ? Math.max(0, Number(selectedBill.total || 0) - Number(selectedBill.paidAmount || 0)) : 0;

  const openFlow = (billId = '') => {
    setStep(0);
    setResult(null);
    setFlowError('');
    const bill = bills.find((item) => item.id === billId);
    setForm({ vendorId: bill?.vendorId || '', billId: bill?.id || '', method: 'BANK', amount: bill ? Math.max(0, bill.total - bill.paidAmount).toFixed(2) : '', date: today(), reference: bill ? `DISB-${bill.billNumber}` : '', notes: '' });
    setShowFlow(true);
  };

  useEffect(() => {
    const billId = location.state?.vendorBillId;
    if (billId && bills.length > 0) {
      openFlow(billId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, bills.length]);

  const selectVendor = (value) => setForm((current) => ({ ...current, vendorId: value, billId: '', amount: '' }));
  const selectBill = (value) => {
    const bill = bills.find((item) => item.id === value);
    setForm((current) => ({ ...current, billId: value, amount: bill ? Math.max(0, bill.total - bill.paidAmount).toFixed(2) : '', reference: bill ? `DISB-${bill.billNumber}` : current.reference }));
  };
  const updateForm = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateDetails = (name, value) => setTestDetails((current) => ({ ...current, [name]: value }));

  const nextStep = () => {
    setFlowError('');
    if (step === 0 && !form.method) return setFlowError('Select a sandbox payment method.');
    if (step === 1) {
      if (!form.vendorId) return setFlowError('Select a vendor.');
      if (!form.billId) return setFlowError('Select a vendor bill.');
      if (!Number(form.amount) || Number(form.amount) <= 0) return setFlowError('Enter a valid payment amount.');
      if (Number(form.amount) > billOutstanding + 0.01) return setFlowError('Payment cannot exceed the bill outstanding balance.');
      if (!form.date) return setFlowError('Payment date is required.');
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const confirmPayment = async () => {
    setProcessing(true);
    setFlowError('');
    try {
      const response = await erpApi.recordPayment({
        paymentType: 'OUTBOUND', method: form.method, amount: Number(form.amount), date: form.date,
        reference: form.reference || `TEST-${Date.now()}`, notes: form.notes || 'Sandbox vendor payment',
        contactId: form.vendorId, vendorBillId: form.billId,
      });
      setResult(response.data.payment);
      setStep(3);
      await loadData();
    } catch (err) {
      setFlowError(err.response?.data?.message || 'Payment could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ErpLayout title="Vendor Payments" subtitle="Accounts Payable and Sandbox Disbursements">
      <div className="vendor-payments-page">
        <div className="vendor-payments-heading"><div><div className="erp-breadcrumb">Home <span>/</span> Payments <span>/</span> Vendor Payments</div><h2>Vendor Payments</h2><p className="subtitle">Record payments made to vendors and reduce outstanding payables.</p></div>{canRecord && <button type="button" className="btn btn-primary" onClick={openFlow}>＋ Make Vendor Payment</button>}</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="vendor-payment-kpis"><div><span>Total Paid</span><strong>{formatCurrency(totalPaid)}</strong><small>Recorded vendor payments</small></div><div><span>Pending Payables</span><strong>{formatCurrency(pendingPayables)}</strong><small>Outstanding vendor bills</small></div><div><span>Total Payments</span><strong>{payments.length}</strong><small>Outbound records</small></div><div><span>Active Vendors</span><strong>{vendors.filter((vendor) => vendor.status === 'ACTIVE').length}</strong><small>Vendor master</small></div></div>
        <div className="vendor-payment-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendor, bill reference, or payment ID..." /><select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)}><option value="ALL">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}><option value="ALL">All methods</option><option value="BANK">Bank Transfer</option><option value="CASH">Cash</option></select><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="ALL">All dates</option><option value={today()}>Today</option></select></div>
        <section className="erp-card-table"><div className="erp-table-header"><h3>Vendor Payments ({filteredPayments.length})</h3><span className="sandbox-label">SANDBOX / TEST MODE</span></div><div className="erp-table-scroll">{loading ? <div className="vendor-payment-state">Loading vendor payments...</div> : filteredPayments.length === 0 ? <div className="vendor-payment-state">No vendor payments recorded yet.</div> : <table className="erp-table"><thead><tr><th>Payment ID</th><th>Date</th><th>Vendor</th><th>Bill / Reference</th><th>Method</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td><strong>{payment.paymentNumber}</strong></td><td>{formatDate(payment.date)}</td><td>{payment.contact?.name || '—'}</td><td><strong>{payment.vendorBill?.billNumber || '—'}</strong><small className="table-subtext">{payment.reference || '—'}</small></td><td>{payment.method === 'BANK' ? 'Bank Transfer' : payment.method}</td><td><strong>{formatCurrency(payment.amount)}</strong></td><td><span className="payment-status">PAID</span></td><td><button type="button" className="btn btn-secondary btn-small" onClick={() => setSelectedPayment(payment)}>View</button></td></tr>)}</tbody></table>}</div></section>
      </div>

      {selectedPayment && <div className="erp-modal-backdrop" onClick={() => setSelectedPayment(null)}><div className="erp-modal" onClick={(event) => event.stopPropagation()}><div className="erp-modal-header"><h3>Vendor Payment Details</h3><button type="button" onClick={() => setSelectedPayment(null)}>✕</button></div><dl className="payment-detail-grid"><dt>Payment ID</dt><dd>{selectedPayment.paymentNumber || '—'}</dd><dt>Vendor</dt><dd>{selectedPayment.contact?.name || '—'}</dd><dt>Vendor ID</dt><dd>{selectedPayment.contact?.id || '—'}</dd><dt>Bill</dt><dd>{selectedPayment.vendorBill?.billNumber || '—'}</dd><dt>Payment Date</dt><dd>{formatDateTime(selectedPayment.date)}</dd><dt>Amount</dt><dd>{formatCurrency(selectedPayment.amount)}</dd><dt>Method</dt><dd>{selectedPayment.method || '—'}</dd><dt>Reference</dt><dd>{selectedPayment.reference || '—'}</dd><dt>Status</dt><dd>PAID (SANDBOX)</dd></dl></div></div>}

      {showFlow && <div className="erp-modal-backdrop" onClick={() => !processing && setShowFlow(false)}><div className="erp-modal vendor-flow-modal" onClick={(event) => event.stopPropagation()}><div className="erp-modal-header"><div><h3>Sandbox Payment</h3><small className="sandbox-label">TEST MODE</small></div><button type="button" onClick={() => setShowFlow(false)} disabled={processing}>✕</button></div><p className="modal-note">This is a sandbox payment. No real money will be deducted.</p><div className="vendor-stepper">{steps.map((label, index) => <div className={index === step ? 'current' : index < step ? 'complete' : ''} key={label}><span>{index < step ? '✓' : index + 1}</span><small>{label}</small></div>)}</div>{flowError && <div className="alert alert-error">{flowError}</div>}
        {step === 0 && <div><h4>Select Method</h4><div className="payment-method-cards"><button type="button" className={form.method === 'BANK' ? 'selected' : ''} onClick={() => updateForm('method', 'BANK')}><strong>Bank Transfer</strong><small>Pay via net banking (Sandbox)</small></button><button type="button" className={form.method === 'CASH' ? 'selected' : ''} onClick={() => updateForm('method', 'CASH')}><strong>Cash</strong><small>Record cash payment (Sandbox)</small></button></div><div className="sandbox-info">Sandbox Mode<br /><span>You can complete this flow using test details. No real money will be deducted.</span></div></div>}
        {step === 1 && <div><h4>Enter Details</h4><label>Vendor<select value={form.vendorId} onChange={(event) => selectVendor(event.target.value)}><option value="">Select vendor</option>{vendors.filter((vendor) => vendor.status !== 'INACTIVE').map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name} · {vendor.id}</option>)}</select></label><label>Vendor Bill<select value={form.billId} onChange={(event) => selectBill(event.target.value)} disabled={!form.vendorId}><option value="">Select unpaid bill</option>{vendorBills.map((bill) => <option key={bill.id} value={bill.id}>{bill.billNumber} · Due {formatCurrency(bill.total - bill.paidAmount)}</option>)}</select></label><div className="payment-form-row"><label>Payment Date<input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} /></label><label>Amount<input type="number" min="0.01" max={billOutstanding || undefined} step="0.01" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} /></label></div><label>Transaction Reference / UTR<input value={form.reference} onChange={(event) => updateForm('reference', event.target.value)} placeholder="TEST987654321" /></label><label>Notes<textarea value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} rows="2" /></label>{form.method === 'BANK' && <div className="sandbox-test-details"><label>Account Holder<input value={testDetails.accountHolder} onChange={(event) => updateDetails('accountHolder', event.target.value)} /></label><label>Bank Name<input value={testDetails.bankName} onChange={(event) => updateDetails('bankName', event.target.value)} /></label><label>Test Account Number<input value={testDetails.accountNumber} onChange={(event) => updateDetails('accountNumber', event.target.value)} /></label><label>Test IFSC<input value={testDetails.ifsc} onChange={(event) => updateDetails('ifsc', event.target.value)} /></label></div>}</div>}
        {step === 2 && <div><h4>Review Payment Details</h4><div className="sandbox-review"><p><b>Vendor</b><span>{selectedVendor?.name || '—'}</span></p><p><b>Bill</b><span>{selectedBill?.billNumber || '—'}</span></p><p><b>Payment Method</b><span>{form.method === 'BANK' ? 'Bank Transfer' : 'Cash'} (Sandbox)</span></p><p><b>Payment Date</b><span>{formatDate(form.date)}</span></p><p><b>Reference</b><span>{form.reference || '—'}</span></p><p><b>Total to Pay</b><strong>{formatCurrency(form.amount)}</strong></p></div></div>}
        {step === 3 && result && <div className="vendor-payment-success"><div className="success-check">✓</div><h3>Payment Successful!</h3><p>The payment has been processed successfully in sandbox mode.</p><p>No real money has been deducted.</p><dl className="payment-detail-grid"><dt>Transaction ID</dt><dd>{result.paymentNumber}</dd><dt>Payment Date</dt><dd>{formatDateTime(result.date)}</dd><dt>Amount</dt><dd>{formatCurrency(result.amount)}</dd><dt>Status</dt><dd>PAID (SANDBOX)</dd></dl><div className="payment-timeline"><span>Payment Initiated</span><span>Processed Successfully</span><span>Recorded in Accounts</span><span>Confirmation Recorded</span></div></div>}
        {step < 3 && <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0 || processing}>Back</button>{step < 2 ? <button type="button" className="btn btn-primary" onClick={nextStep}>Continue</button> : <button type="button" className="btn btn-primary" onClick={confirmPayment} disabled={processing}>{processing ? 'Processing sandbox payment...' : 'Confirm Payment'}</button>}</div>}{step === 3 && <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={openFlow}>Make Another Payment</button><button type="button" className="btn btn-primary" onClick={() => setShowFlow(false)}>Done</button></div>}</div></div>}
    </ErpLayout>
  );
};

export default VendorPaymentsPage;
