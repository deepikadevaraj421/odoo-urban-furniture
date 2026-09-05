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
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Portal — My Payments" />

      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#f3f4f6', margin: '0 0 4px 0' }}>My Payments</h2>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
              Showing payment transactions for Customer ID: <strong style={{ color: '#00d4aa' }}>{paymentsData?.customerCode}</strong>
            </p>
          </div>
          <button onClick={() => navigate(ROUTES.CUSTOMER_DASHBOARD)} className="btn-secondary">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-container" style={{ background: '#111827', borderRadius: '10px', border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading payments...</div>
          ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No payment records found for your account.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Payment #</th>
                  <th style={{ padding: '14px 16px' }}>Invoice #</th>
                  <th style={{ padding: '14px 16px' }}>Customer ID</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 16px' }}>Method</th>
                  <th style={{ padding: '14px 16px' }}>Amount</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.payments.map((pay) => (
                  <tr key={pay.id} style={{ borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f59e0b' }}>{pay.paymentNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#60a5fa' }}>{pay.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#00d4aa', fontWeight: '600' }}>{pay.customerCode}</td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{pay.date}</td>
                    <td style={{ padding: '14px 16px', color: '#d1d5db' }}>{pay.paymentMethod}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10b981' }}>₹{pay.amount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-active" style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
                        {pay.status}
                      </span>
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
