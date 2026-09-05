import Header from '../../../components/layout/Header';

const CustomerDashboard = () => {
  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Customer Dashboard" />

      <main className="dashboard-content">
        <div className="placeholder-card">
          <div className="placeholder-icon">🪑 💼</div>
          <h2>Urban Furniture</h2>
          <h3>Customer Dashboard</h3>
          <p className="placeholder-note">
            Customer portal (Invoices, Orders, Payment Status, Support) will be initialized here in subsequent modules.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
