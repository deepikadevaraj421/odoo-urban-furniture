import Header from '../../../components/layout/Header';

const SalesAccountantDashboard = () => {
  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Sales Accountant Dashboard" />

      <main className="dashboard-content">
        <div className="placeholder-card">
          <div className="placeholder-icon">📊 🛍️</div>
          <h2>Urban Furniture</h2>
          <h3>Sales Accountant Dashboard</h3>
          <p className="placeholder-note">
            Sales modules (Sales Orders, Invoices, Payments, Customer Accounts) will be initialized here in subsequent modules.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SalesAccountantDashboard;
