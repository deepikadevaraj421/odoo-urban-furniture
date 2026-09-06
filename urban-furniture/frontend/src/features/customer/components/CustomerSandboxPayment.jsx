import { useState } from 'react';
import erpApi from '../../../services/erpApi';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';

const steps = ['Select Method', 'Enter Details', 'Review', 'Payment Result'];
const today = () => new Date().toISOString().slice(0, 10);

const CustomerSandboxPayment = ({ invoice, customer, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState('BANK');
  const [amount, setAmount] = useState(Math.max(0, invoice.total - invoice.paidAmount).toFixed(2));
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState(`TEST-${Date.now()}`);
  const [notes, setNotes] = useState('Customer sandbox payment');
  const [details, setDetails] = useState({ accountHolder: 'Urban Furniture Customer', bankName: 'Sandbox Bank', accountNumber: 'TEST-ACCOUNT-001', ifsc: 'TEST0001234' });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState(null);
  const outstanding = Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0));
  const parsedAmount = Number(amount);

  const updateDetails = (name, value) => setDetails((current) => ({ ...current, [name]: value }));
  const continueFlow = () => {
    setError('');
    if (step === 1 && (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > outstanding + 0.01)) {
      setError('Payment cannot exceed the outstanding amount.');
      return;
    }
    if (step === 1 && !date) {
      setError('Payment date is required.');
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const confirmPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await erpApi.recordPayment({
        paymentType: 'INBOUND', method, amount: parsedAmount, date, reference, notes,
        customerInvoiceId: invoice.id,
      });
      setPayment(response.data.payment);
      setStep(3);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="erp-modal-backdrop" onClick={() => !processing && onClose()}>
      <div className="erp-modal customer-sandbox-modal" onClick={(event) => event.stopPropagation()}>
        <div className="erp-modal-header"><div><h3>Sandbox Payment</h3><small className="sandbox-label">TEST MODE</small></div><button type="button" onClick={onClose} disabled={processing}>✕</button></div>
        <p className="modal-note">This is a sandbox payment. No real money will be deducted.</p>
        <div className="vendor-stepper">{steps.map((label, index) => <div className={index === step ? 'current' : index < step ? 'complete' : ''} key={label}><span>{index < step ? '✓' : index + 1}</span><small>{label}</small></div>)}</div>
        {error && <div className="alert alert-error">{error}</div>}
        {step === 0 && <div><h4>Select Method</h4><div className="payment-method-cards"><button type="button" className={method === 'BANK' ? 'selected' : ''} onClick={() => setMethod('BANK')}><strong>Sandbox Bank Transfer</strong><small>Test method only</small></button><button type="button" className={method === 'CASH' ? 'selected' : ''} onClick={() => setMethod('CASH')}><strong>Sandbox Cash</strong><small>Test method only</small></button></div><div className="sandbox-info">Sandbox Mode<br /><span>No real money will be deducted or transferred.</span></div></div>}
        {step === 1 && <div><h4>Enter Test Details</h4><p className="modal-note">Customer: {customer?.name || '—'} · Invoice: {invoice.invoiceNumber}</p><div className="payment-form-row"><label>Payment Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Amount<input type="number" min="0.01" max={outstanding} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label></div>{method === 'BANK' && <div className="sandbox-test-details"><label>Account Holder<input value={details.accountHolder} onChange={(event) => updateDetails('accountHolder', event.target.value)} /></label><label>Bank<input value={details.bankName} onChange={(event) => updateDetails('bankName', event.target.value)} /></label><label>Test Account<input value={details.accountNumber} onChange={(event) => updateDetails('accountNumber', event.target.value)} /></label><label>Test IFSC<input value={details.ifsc} onChange={(event) => updateDetails('ifsc', event.target.value)} /></label></div>}<label>Transaction Reference<input value={reference} onChange={(event) => setReference(event.target.value)} /></label><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="2" /></label></div>}
        {step === 2 && <div><h4>Review Payment</h4><div className="sandbox-review"><p><b>Customer</b><span>{customer?.name || '—'}</span></p><p><b>Customer ID</b><span>{customer?.customerCode || '—'}</span></p><p><b>Invoice</b><span>{invoice.invoiceNumber}</span></p><p><b>Outstanding</b><span>{formatCurrency(outstanding)}</span></p><p><b>Payment Amount</b><strong>{formatCurrency(parsedAmount)}</strong></p><p><b>Method</b><span>{method === 'BANK' ? 'Sandbox Bank Transfer' : 'Sandbox Cash'}</span></p><p><b>Payment Date</b><span>{formatDate(date)}</span></p><p><b>Reference</b><span>{reference || '—'}</span></p></div></div>}
        {step === 3 && payment && <div className="vendor-payment-success"><div className="success-check">✓</div><h3>Payment Successful!</h3><p>Your payment has been recorded successfully in sandbox mode.</p><p>No real money has been deducted.</p><dl className="payment-detail-grid"><dt>Payment ID</dt><dd>{payment.paymentNumber}</dd><dt>Invoice</dt><dd>{invoice.invoiceNumber}</dd><dt>Amount</dt><dd>{formatCurrency(payment.amount)}</dd><dt>Date</dt><dd>{formatDateTime(payment.date)}</dd><dt>Reference</dt><dd>{payment.reference || reference}</dd><dt>Status</dt><dd>{Number(invoice.paidAmount) + parsedAmount >= Number(invoice.total) - 0.01 ? 'PAID (SANDBOX)' : 'PARTIALLY_PAID (SANDBOX)'}</dd></dl><div className="payment-timeline"><span>Payment Initiated</span><span>Processed Successfully</span><span>Recorded in Accounts</span><span>Invoice Updated</span></div></div>}
        {step < 3 && <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0 || processing}>Back</button>{step < 2 ? <button type="button" className="btn btn-primary" onClick={continueFlow}>Continue</button> : <button type="button" className="btn btn-primary" onClick={confirmPayment} disabled={processing}>{processing ? 'Processing sandbox payment...' : 'Confirm Payment'}</button>}</div>}
        {step === 3 && <div className="modal-actions"><button type="button" className="btn btn-primary" onClick={onClose}>Back to My Invoices</button></div>}
      </div>
    </div>
  );
};

export default CustomerSandboxPayment;
