import { useState, useEffect } from 'react';
import { StatusBadge } from './CustomerUI';
import customerApi from '../../../services/customerApi';

/* ──────────────────────────────
   Format currency
────────────────────────────── */
const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/* ──────────────────────────────
   EMI Calculator Panel
────────────────────────────── */
const EMI_PERIODS = [3, 6, 9, 12];

const EmiPanel = ({ invoice, onSuccess, onClose }) => {
  const outstanding = invoice.outstanding || 0;
  const [downPayment, setDownPayment] = useState('');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dp = parseFloat(downPayment) || 0;
  const remaining = Math.max(0, outstanding - dp);
  const emi = months > 0 ? (remaining / months) : 0;

  const firstDue = new Date();
  firstDue.setMonth(firstDue.getMonth() + 1);

  const handleCreate = async () => {
    if (dp < 0 || dp >= outstanding) {
      setError(`Down payment must be between 0 and ${fmt(outstanding - 1)}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await customerApi.createEmi(invoice.id, {
        downPayment: dp,
        numberOfInstallments: months,
        startDate: new Date().toISOString(),
      });
      onSuccess('EMI plan created successfully! 🎉');
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create EMI plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: 'var(--cp-bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)', fontWeight: 600, marginBottom: 4 }}>
          Invoice Total Outstanding
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--cp-text-primary)' }}>
          {fmt(outstanding)}
        </div>
      </div>

      <div className="cp-form-group">
        <label className="cp-form-label" htmlFor="cp-emi-dp">Down Payment (optional)</label>
        <input
          id="cp-emi-dp"
          type="number"
          className="cp-form-input"
          placeholder="e.g. 5000"
          value={downPayment}
          min={0}
          max={outstanding - 1}
          onChange={(e) => setDownPayment(e.target.value)}
        />
      </div>

      <div className="cp-form-group">
        <label className="cp-form-label">EMI Period</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {EMI_PERIODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: months === m ? 'var(--cp-green)' : 'var(--cp-border)',
                background: months === m ? 'var(--cp-green-pale)' : 'transparent',
                color: months === m ? 'var(--cp-green)' : 'var(--cp-text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {m} mo
            </button>
          ))}
        </div>
      </div>

      <div className="cp-emi-highlight">
        <div className="cp-emi-highlight-label">Monthly EMI</div>
        <div className="cp-emi-highlight-val">{fmt(emi)}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="cp-emi-row">
          <span className="cp-emi-row-label">Remaining Amount</span>
          <span className="cp-emi-row-val">{fmt(remaining)}</span>
        </div>
        <div className="cp-emi-row">
          <span className="cp-emi-row-label">Number of Installments</span>
          <span className="cp-emi-row-val">{months}</span>
        </div>
        <div className="cp-emi-row">
          <span className="cp-emi-row-label">First Due Date</span>
          <span className="cp-emi-row-val">{firstDue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="cp-emi-row">
          <span className="cp-emi-row-label">Total Payable</span>
          <span className="cp-emi-row-val">{fmt(dp + remaining)}</span>
        </div>
      </div>

      {error && <div className="cp-alert error" style={{ marginTop: 12 }}>⚠️ {error}</div>}

      <div className="cp-modal-footer" style={{ padding: '16px 0 0' }}>
        <button className="cp-btn cp-btn-outline" onClick={onClose} type="button">Cancel</button>
        <button
          className="cp-btn cp-btn-primary"
          onClick={handleCreate}
          disabled={loading}
          type="button"
          id="cp-emi-confirm-btn"
        >
          {loading ? 'Creating...' : 'Confirm EMI Plan'}
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────
   Payment Modal
────────────────────────────── */
const PAYMENT_TABS = [
  { id: 'CASH', label: '💵 Cash' },
  { id: 'BANK', label: '🏦 Bank' },
  { id: 'ONLINE', label: '🌐 Online' },
  { id: 'EMI', label: '📅 EMI' },
];

const PaymentModal = ({ invoice, onClose, onPaymentSuccess }) => {
  const [activeTab, setActiveTab] = useState('CASH');
  const [amount, setAmount] = useState(String(invoice.outstanding || ''));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mock online payment steps
  const [onlineStep, setOnlineStep] = useState(1);
  const [onlineMethod, setOnlineMethod] = useState('UPI');

  const outstanding = invoice.outstanding || 0;

  const handlePay = async () => {
    if (activeTab === 'EMI') return; // handled by EmiPanel

    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) { setError('Enter a valid amount.'); return; }
    if (payAmt > outstanding) { setError(`Amount cannot exceed outstanding ${fmt(outstanding)}.`); return; }

    setLoading(true);
    setError('');

    try {
      if (activeTab === 'ONLINE' && onlineStep === 1) {
        setOnlineStep(2);
        setLoading(false);
        return;
      }

      await customerApi.payInvoice(invoice.id, {
        amount: payAmt,
        method: activeTab,
        referenceNumber: reference || undefined,
        notes: notes || undefined,
      });

      setSuccessMsg('Payment successful! 🎉');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'EMI') {
      return <EmiPanel invoice={invoice} onSuccess={onPaymentSuccess} onClose={onClose} />;
    }

    if (activeTab === 'ONLINE' && onlineStep === 2) {
      return (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              Secure Payment Gateway
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cp-text-muted)' }}>
              Demo payment environment — no real transaction
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['UPI', 'Card', 'Net Banking'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setOnlineMethod(m)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid',
                  borderColor: onlineMethod === m ? 'var(--cp-green)' : 'var(--cp-border)',
                  background: onlineMethod === m ? 'var(--cp-green-pale)' : 'transparent',
                  color: onlineMethod === m ? 'var(--cp-green)' : 'var(--cp-text-secondary)',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--cp-green-pale)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--cp-green)', fontWeight: 600, marginBottom: 2 }}>Amount to Pay</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--cp-green)' }}>
              {fmt(parseFloat(amount))}
            </div>
          </div>

          {reference && <div className="cp-form-group">
            <label className="cp-form-label">Transaction Reference</label>
            <input className="cp-form-input" value={reference} readOnly style={{ opacity: 0.7 }} />
          </div>}

          {error && <div className="cp-alert error">⚠️ {error}</div>}

          <div className="cp-modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="cp-btn cp-btn-outline" onClick={() => setOnlineStep(1)} type="button">← Back</button>
            <button
              className="cp-btn cp-btn-primary"
              onClick={handlePay}
              disabled={loading}
              type="button"
              id="cp-pay-confirm-btn"
            >
              {loading ? 'Processing...' : `Pay ${fmt(parseFloat(amount) || 0)}`}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="cp-form-group">
          <label className="cp-form-label" htmlFor="cp-pay-amount">
            Amount {activeTab === 'ONLINE' ? '' : '(₹)'}
          </label>
          <input
            id="cp-pay-amount"
            type="number"
            className="cp-form-input"
            value={amount}
            min={1}
            max={outstanding}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max: ${fmt(outstanding)}`}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)', marginTop: 3 }}>
            Outstanding: {fmt(outstanding)}
          </div>
        </div>

        {(activeTab === 'BANK' || activeTab === 'ONLINE') && (
          <div className="cp-form-group">
            <label className="cp-form-label" htmlFor="cp-pay-ref">
              {activeTab === 'BANK' ? 'Bank Reference Number' : 'Transaction ID (optional)'}
            </label>
            <input
              id="cp-pay-ref"
              type="text"
              className="cp-form-input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={activeTab === 'BANK' ? 'e.g. TXN123456789' : 'Optional reference'}
            />
          </div>
        )}

        <div className="cp-form-group">
          <label className="cp-form-label" htmlFor="cp-pay-notes">Notes (optional)</label>
          <input
            id="cp-pay-notes"
            type="text"
            className="cp-form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
          />
        </div>

        {activeTab === 'CASH' && (
          <div style={{ background: 'var(--cp-amber-pale)', border: '1px solid rgba(212,132,10,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: '0.8rem', color: 'var(--cp-amber)', marginBottom: 8 }}>
            💡 Cash payment will be recorded and your invoice updated immediately.
          </div>
        )}

        {error && <div className="cp-alert error">⚠️ {error}</div>}

        <div className="cp-modal-footer" style={{ padding: '16px 0 0' }}>
          <button className="cp-btn cp-btn-outline" onClick={onClose} type="button">Cancel</button>
          <button
            className="cp-btn cp-btn-primary"
            onClick={handlePay}
            disabled={loading}
            type="button"
            id="cp-pay-now-btn"
          >
            {loading ? 'Processing...' : activeTab === 'ONLINE' ? 'Proceed to Payment →' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="cp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-pay-modal-title">
      <div className="cp-modal">
        <div className="cp-modal-header">
          <div id="cp-pay-modal-title" className="cp-modal-title">
            Pay Invoice — {invoice.invoiceNumber}
          </div>
          <button className="cp-modal-close" onClick={onClose} aria-label="Close payment modal">✕</button>
        </div>

        <div className="cp-modal-body">
          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--cp-green)' }}>
                {successMsg}
              </div>
            </div>
          ) : (
            <>
              {/* Invoice summary */}
              <div style={{
                background: 'var(--cp-bg)', borderRadius: 8, padding: '10px 14px',
                marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)', fontWeight: 600 }}>Total</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{fmt(invoice.totalAmount)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)', fontWeight: 600 }}>Paid</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--cp-green)' }}>{fmt(invoice.paidAmount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)', fontWeight: 600 }}>Outstanding</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--cp-red)' }}>{fmt(invoice.outstanding)}</div>
                </div>
              </div>

              {/* Payment method tabs */}
              <div className="cp-pay-tabs" role="tablist" aria-label="Payment methods">
                {PAYMENT_TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`cp-pay-tab ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => { setActiveTab(t.id); setError(''); setOnlineStep(1); }}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    id={`cp-pay-tab-${t.id.toLowerCase()}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {renderTabContent()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
