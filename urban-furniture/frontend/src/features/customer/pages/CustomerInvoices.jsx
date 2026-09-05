import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import { customerApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';

const CustomerInvoices = () => {
  const navigate = useNavigate();
  const [invoicesData, setInvoicesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await customerApi.getInvoices();
        setInvoicesData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoices.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Customer Portal — My Invoices" />

      <main className="dashboard-main">
        <div className="flex-between mb-4">
          <div>
            <h2>My Invoices</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Showing billing records linked to Customer ID:{' '}
              <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
                {invoicesData?.customerCode}
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
              Loading invoices...
            </div>
          ) : !invoicesData?.invoices || invoicesData.invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No invoices found</h3>
              <p>No billing invoices are currently issued for your customer account.</p>
            </div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoicesData.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.customerCode}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{inv.date}</td>
                    <td>{inv.description}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-success">{inv.status}</span>
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

export default CustomerInvoices;

