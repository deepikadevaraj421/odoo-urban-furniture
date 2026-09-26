import { useEffect, useMemo, useState } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { customerApi } from '../../../services/authApi';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import heroImg from '../../../assets/hero_furniture.png';

const toInputDate = (date) => date.toISOString().slice(0, 10);
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getRange = (preset) => {
  const now = new Date();
  if (preset === 'LAST_MONTH') {
    const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { from: toInputDate(startOfMonth(date)), to: toInputDate(endOfMonth(date)) };
  }
  if (preset === 'QUARTER') {
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    return {
      from: toInputDate(new Date(now.getFullYear(), quarterStart, 1)),
      to: toInputDate(new Date(now.getFullYear(), quarterStart + 3, 0)),
    };
  }
  if (preset === 'YEAR') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  return { from: toInputDate(startOfMonth(now)), to: toInputDate(endOfMonth(now)) };
};

const statusLabel = () => 'RECEIVED';

const CustomerPaymentsPage = () => {
  const { user, hasPermission } = useAuth();
  const canRecord = hasPermission(PERMISSIONS.RECORD_CUSTOMER_PAYMENTS);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [customerId, setCustomerId] = useState('ALL');
  const [preset, setPreset] = useState('THIS_MONTH');
  const [range, setRange] = useState(() => getRange('THIS_MONTH'));
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRecord, setShowRecord] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [recording, setRecording] = useState(false);
  const [form, setForm] = useState({
    customerId: '', invoiceId: '', date: toInputDate(new Date()), method: 'BANK', amount: '', reference: '', notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        paymentType: 'INBOUND',
        dateFrom: range.from,
        dateTo: range.to,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(method !== 'ALL' ? { method } : {}),
        ...(status !== 'ALL' ? { status } : {}),
        ...(customerId !== 'ALL' ? { customerId } : {}),
      };
      const [paymentResponse, customerResponse, invoiceResponse] = await Promise.all([
        erpApi.getPayments(params),
        customerApi.getCustomers('', user?.role === 'ACCOUNTANT' ? 'accountant' : 'admin'),
        erpApi.getCustomerInvoices(),
      ]);
      setPayments(paymentResponse.data.payments || []);
      setCustomers((customerResponse.data.customers || []).filter((item) => item.status === 'ACTIVE' && item.contactId).map((item) => ({ ...item, id: item.contactId })));
      setInvoices(invoiceResponse.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load customer payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [range.from, range.to, method, status, customerId, search, user?.role]);

  const totalReceived = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalPayments = payments.length;
  const pendingReceivables = invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)), 0);
  const activeCustomers = customers.filter((customer) => customer.status === 'ACTIVE').length;

  const breakdown = useMemo(() => {
    const values = payments.reduce((result, payment) => {
      result[payment.method] = (result[payment.method] || 0) + Number(payment.amount || 0);
      return result;
    }, {});
    return Object.entries(values).sort(([, first], [, second]) => second - first);
  }, [payments]);

  const recentCustomers = useMemo(() => {
    const seen = new Set();
    return payments.filter((payment) => {
      const id = payment.contact?.id || payment.contactId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 5);
  }, [payments]);

  const invoicesForCustomer = invoices.filter((invoice) => invoice.customerId === form.customerId && invoice.status !== 'PAID');
  const selectedInvoice = invoices.find((invoice) => invoice.id === form.invoiceId);
  const outstanding = selectedInvoice ? Math.max(0, Number(selectedInvoice.total || 0) - Number(selectedInvoice.paidAmount || 0)) : 0;

  const openRecord = (customer = '') => {
    setForm({ customerId: customer, invoiceId: '', date: toInputDate(new Date()), method: 'BANK', amount: '', reference: '', notes: '' });
    setRecordError('');
    setShowRecord(true);
  };

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value, ...(name === 'customerId' ? { invoiceId: '', amount: '' } : {}) }));
  };

  const handleInvoiceChange = (value) => {
    const invoice = invoices.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      invoiceId: value,
      amount: invoice ? Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)).toFixed(2) : '',
      reference: invoice ? `REC-${invoice.invoiceNumber}` : current.reference,
    }));
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setRecording(true);
    setRecordError('');
    try {
      await erpApi.recordPayment({
        paymentType: 'INBOUND', method: form.method, amount: Number(form.amount), date: form.date,
        reference: form.reference, notes: form.notes, contactId: form.customerId, customerInvoiceId: form.invoiceId,
      });
      setShowRecord(false);
      await loadData();
    } catch (err) {
      setRecordError(err.response?.data?.message || 'Unable to record customer payment.');
    } finally {
      setRecording(false);
    }
  };

  const selectPreset = (value) => {
    setPreset(value);
    if (value !== 'CUSTOM') setRange(getRange(value));
  };

  return (
    <ErpLayout title="Customer Payments" subtitle="Receivables and customer payment activity">
      <div className="customer-payments-page">
        <div className="customer-payments-heading">
          <div>
            <div className="erp-breadcrumb">Home <span>/</span> Payments <span>/</span> Customer Payments</div>
            <h2>Customer Payments</h2>
            <p className="subtitle">Track and manage all payments received from your customers.</p>
          </div>
          {canRecord && <button type="button" className="btn btn-primary" onClick={() => openRecord()}>＋ Record Customer Payment</button>}
        </div>

        <div className="customer-payments-hero">
          <div><span className="sandbox-label">SANDBOX / TEST MODE</span><h3>Receivables, kept beautifully clear.</h3><p>This is a demo payment workflow. No real money will be deducted.</p></div>
          <img src={heroImg} alt="Furniture showroom" />
          <strong>Happy customers build stronger businesses.</strong>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <div className="customer-payments-kpis">
          <div><span>Total Received</span><strong>{formatCurrency(totalReceived)}</strong><small>Selected period</small></div>
          <div><span>Pending Receivables</span><strong>{formatCurrency(pendingReceivables)}</strong><small>Across customer invoices</small></div>
          <div><span>Total Payments</span><strong>{totalPayments}</strong><small>Recorded receipts</small></div>
          <div><span>Active Customers</span><strong>{activeCustomers}</strong><small>Customer master</small></div>
        </div>

        <div className="customer-payments-toolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, ID, invoice, payment or reference" aria-label="Search customer payments" />
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} aria-label="Filter customer"><option value="ALL">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.id})</option>)}</select>
          <select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Filter payment method"><option value="ALL">All methods</option><option value="CASH">Cash</option><option value="BANK">Bank</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter payment status"><option value="ALL">All statuses</option><option value="RECEIVED">Received</option><option value="PENDING">Pending invoice</option></select>
          <select value={preset} onChange={(event) => selectPreset(event.target.value)} aria-label="Filter date range"><option value="THIS_MONTH">This month</option><option value="LAST_MONTH">Last month</option><option value="QUARTER">This quarter</option><option value="YEAR">This year</option><option value="CUSTOM">Custom range</option></select>
          {preset === 'CUSTOM' && <><input type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /><input type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></>}
        </div>

        <div className="customer-payments-grid">
          <section className="erp-card-table customer-payments-table-card">
            <div className="erp-table-header"><h3>Customer Payments ({payments.length})</h3><span>{formatDate(range.from)} - {formatDate(range.to)}</span></div>
            <div className="erp-table-scroll">
              {loading ? <div className="customer-payments-state">Loading customer payments...</div> : payments.length === 0 ? <div className="customer-payments-state">No customer payments recorded yet.</div> : <table className="erp-table"><thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Invoice / Reference</th><th>Method</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{payments.map((payment, index) => <tr key={payment.id}><td>{index + 1}</td><td>{formatDate(payment.date)}</td><td><strong>{payment.contact?.name || '—'}</strong><small className="table-subtext">{payment.contact?.id || '—'}</small></td><td><strong>{payment.customerInvoice?.invoiceNumber || '—'}</strong><small className="table-subtext">{payment.reference || '—'}</small></td><td>{payment.method || '—'}</td><td><strong>{formatCurrency(payment.amount)}</strong></td><td><span className="payment-status">{statusLabel(payment)}</span></td><td><button type="button" className="btn btn-secondary btn-small" onClick={() => setSelectedPayment(payment)}>View</button></td></tr>)}</tbody></table>}
            </div>
          </section>

          <aside className="customer-payments-side">
            <div className="payments-side-card"><h3>Payment Method Breakdown</h3>{breakdown.length === 0 ? <p className="muted-text">No payment methods in this period.</p> : <>{breakdown.map(([label, amount]) => <div className="breakdown-row" key={label}><span><i className={`method-dot ${label.toLowerCase()}`} />{label}</span><strong>{formatCurrency(amount)}</strong><small>{totalReceived ? Math.round((amount / totalReceived) * 100) : 0}%</small></div>)}<div className="breakdown-total"><span>Total Received</span><strong>{formatCurrency(totalReceived)}</strong></div></>}</div>
            <div className="payments-side-card"><h3>Recent Customers</h3>{recentCustomers.length === 0 ? <p className="muted-text">No recent customer activity.</p> : recentCustomers.map((payment) => <button type="button" className="recent-customer" key={payment.contact?.id || payment.id} onClick={() => setCustomerId(payment.contact?.id || 'ALL')}><span className="customer-avatar">{(payment.contact?.name || '?').slice(0, 1).toUpperCase()}</span><span><strong>{payment.contact?.name || '—'}</strong><small>{payment.contact?.id || '—'} · {formatDate(payment.date)}</small></span><b>{formatCurrency(payment.amount)}</b></button>)}</div>
          </aside>
        </div>
      </div>

      {selectedPayment && <div className="erp-modal-backdrop" onClick={() => setSelectedPayment(null)}><div className="erp-modal" onClick={(event) => event.stopPropagation()}><div className="erp-modal-header"><h3>Payment Details</h3><button type="button" onClick={() => setSelectedPayment(null)}>✕</button></div><dl className="payment-detail-grid"><dt>Payment ID</dt><dd>{selectedPayment.paymentNumber || '—'}</dd><dt>Customer</dt><dd>{selectedPayment.contact?.name || '—'}</dd><dt>Customer ID</dt><dd>{selectedPayment.contact?.id || '—'}</dd><dt>Invoice</dt><dd>{selectedPayment.customerInvoice?.invoiceNumber || '—'}</dd><dt>Payment Date</dt><dd>{formatDateTime(selectedPayment.date)}</dd><dt>Amount</dt><dd>{formatCurrency(selectedPayment.amount)}</dd><dt>Method</dt><dd>{selectedPayment.method || '—'}</dd><dt>Reference</dt><dd>{selectedPayment.reference || '—'}</dd><dt>Status</dt><dd>{statusLabel(selectedPayment)}</dd></dl></div></div>}

      {showRecord && <div className="erp-modal-backdrop" onClick={() => setShowRecord(false)}><form className="erp-modal payment-form-modal" onSubmit={submitPayment} onClick={(event) => event.stopPropagation()}><div className="erp-modal-header"><div><h3>Record Customer Payment</h3><small className="sandbox-label">SANDBOX / TEST MODE</small></div><button type="button" onClick={() => setShowRecord(false)}>✕</button></div><p className="modal-note">This is a demo payment. No real money will be deducted.</p>{recordError && <div className="alert alert-error">{recordError}</div>}<label>Customer<select required value={form.customerId} onChange={(event) => updateForm('customerId', event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.id})</option>)}</select></label><label>Invoice<select required value={form.invoiceId} onChange={(event) => handleInvoiceChange(event.target.value)}><option value="">Select invoice</option>{invoicesForCustomer.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · Outstanding {formatCurrency(Number(invoice.total || 0) - Number(invoice.paidAmount || 0))}</option>)}</select></label><div className="payment-form-row"><label>Payment Date<input type="date" required value={form.date} onChange={(event) => updateForm('date', event.target.value)} /></label><label>Method<select value={form.method} onChange={(event) => updateForm('method', event.target.value)}><option value="BANK">Bank</option><option value="CASH">Cash</option></select></label></div><label>Amount<input type="number" min="0.01" max={outstanding || undefined} step="0.01" required value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} placeholder="0.00" /></label><label>Reference<input value={form.reference} onChange={(event) => updateForm('reference', event.target.value)} placeholder="Receipt reference" /></label><label>Notes<textarea value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} rows="2" placeholder="Optional notes" /></label><button type="submit" className="btn btn-primary btn-full" disabled={recording}>{recording ? 'Recording payment...' : 'Confirm Payment'}</button></form></div>}
    </ErpLayout>
  );
};

export default CustomerPaymentsPage;
