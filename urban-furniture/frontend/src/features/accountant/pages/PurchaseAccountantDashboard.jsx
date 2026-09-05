import Header from '../../../components/layout/Header';

const PurchaseAccountantDashboard = () => {
  return (
    <div className="dashboard-layout">
      <Header title="Urban Furniture ERP" subtitle="Purchase & AP Portal" />

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>Purchase Accountant Portal</h2>
          <p>Oversee vendor relations, purchase requisitions, and accounts payable.</p>
        </div>

        <div className="dashboard-grid">
          <div className="action-card disabled">
            <div className="action-icon">🚚</div>
            <h3>Vendor Directory</h3>
            <p>Maintain furniture supplier profiles, contracts, and payment terms.</p>
            <span className="badge badge-warning" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Coming Soon</span>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">📄</div>
            <h3>Purchase Orders</h3>
            <p>Create and track purchase orders for raw materials and finished urban furniture items.</p>
            <span className="badge badge-warning" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Coming Soon</span>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">💰</div>
            <h3>Vendor Bills & Disbursements</h3>
            <p>Process vendor bills, match receipts, and manage outgoing supplier payments.</p>
            <span className="badge badge-warning" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchaseAccountantDashboard;

