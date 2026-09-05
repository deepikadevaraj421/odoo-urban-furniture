import Header from '../../../components/layout/Header';

const PurchaseAccountantDashboard = () => {
  return (
    <div className="dashboard-container">
      <Header title="Urban Furniture" subtitle="Purchase Accountant Dashboard" />

      <main className="dashboard-content">
        <div className="placeholder-card">
          <div className="placeholder-icon">📦 🧾</div>
          <h2>Urban Furniture</h2>
          <h3>Purchase Accountant Dashboard</h3>
          <p className="placeholder-note">
            Purchase modules (Purchase Orders, Vendor Bills, Payments, Supplier Accounts) will be initialized here in subsequent modules.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PurchaseAccountantDashboard;
