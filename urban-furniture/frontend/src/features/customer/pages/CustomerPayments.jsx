import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { customerApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const CustomerPayments = () => {
  const navigate = useNavigate();
  const [paymentsData, setPaymentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await customerApi.getPayments();
        setPaymentsData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payments.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Customer Portal — My Payments" />

      <main className="dashboard-main">
        <div className="flex-between mb-4">
          <div>
            <h2>My Payments</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Showing payment transactions for Customer ID:{' '}
              <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
                {paymentsData?.customerCode}
              </strong>
            </p>
          </div>
          <button onClick={() => navigate(ROUTES.CUSTOMER_DASHBOARD)} className="btn btn-outline">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="table-container card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading payments...
            </div>
          ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <h3>No payment records found</h3>
              <p>No payment receipts or transaction records exist for your customer account.</p>
            </div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Invoice #</th>
                  <th>Customer ID</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                        {pay.paymentNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{pay.invoiceNumber}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{pay.customerCode}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{pay.date}</td>
                    <td>{pay.paymentMethod}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-success">{pay.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerPayments;

