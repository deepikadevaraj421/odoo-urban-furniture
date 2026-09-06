import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import { customerApi } from '../../../services/authApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await customerApi.getPayments();
        setPayments(res.data.payments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payments.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <ErpLayout title="My Payments" subtitle="Settlement History & Receipts">
      <div className="customer-dir-title-row">
        <div>
          <h2>My Payment History</h2>
          <p className="subtitle">Official payment receipts credited to your invoices</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Payment Receipts ({payments.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your payment receipts...
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">💳</div>
              <h3>No payments found</h3>
              <p>When you settle an invoice via Bank or Cash, payment receipts will appear here.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Settled Invoice</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="customer-code">{p.paymentNumber}</span>
                    </td>
                    <td>{formatDate(p.date)}</td>
                    <td>
                      {p.customerInvoice ? (
                        <span className="customer-code">{p.customerInvoice.invoiceNumber}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className="badge badge-admin">{p.method}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.reference || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td>
                      <span className="badge badge-active">CONFIRMED</span>
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

export default CustomerPayments;


