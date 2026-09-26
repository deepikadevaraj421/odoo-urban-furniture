import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { ROUTES } from '../../../utils/constants';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { useAuth } from '../../../context/AuthContext';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', description: '', quantity: 20, unitPrice: 3000, taxRate: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, vRes, pRes] = await Promise.all([
        erpApi.getPurchaseOrders(),
        erpApi.getContacts({ type: 'VENDOR' }),
        erpApi.getProducts(),
      ]);
      setOrders(poRes.data.orders || []);

      // Contacts with type VENDOR or BOTH
      const eligibleVendors = (vRes.data.contacts || []).filter(
        (c) => c.type === 'VENDOR' || c.type === 'BOTH'
      );
      setVendors(eligibleVendors);
      setProducts(pRes.data.products || []);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        description: prod ? prod.name : '',
        unitPrice: prod ? prod.costPrice || 3000 : 0,
      };
      return copy;
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', description: '', quantity: 10, unitPrice: 0, taxRate: 0 },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    setVendorId('');
    setItems([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
    setShowModal(true);
  };

  const calculatedSubtotal = items.reduce((sum, it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const calculatedTax = items.reduce((sum, it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.unitPrice) || 0;
    const t = parseFloat(it.taxRate) || 0;
    return sum + (q * p * (t / 100));
  }, 0);

  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await erpApi.createPurchaseOrder({
        vendorId,
        date,
        notes,
        items,
      });
      setShowModal(false);
      setActionSuccess('Purchase Order created successfully in database!');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await erpApi.confirmPurchaseOrder(orderId);
      setActionSuccess('Purchase Order confirmed with supplier!');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm order.');
    }
  };

  const handleReceiveGoods = async (orderId) => {
    try {
      await erpApi.receiveGoods(orderId);
      setActionSuccess('Goods received & verified! Order is now ready for vendor billing.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark goods received.');
    }
  };

  const handleCreateBill = async (orderId) => {
    try {
      const res = await erpApi.createBillFromOrder(orderId);
      setActionSuccess(res.data.message || 'Vendor Bill created from received Purchase Order!');
      setTimeout(() => {
        setActionSuccess('');
        navigate(ROUTES.VENDOR_BILLS);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vendor bill.');
    }
  };

  // Real Database Summary Metrics
  const draftPOCount = orders.filter((o) => o.status === 'DRAFT').length;
  const confirmedPOCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const receivedPOCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const totalPurchaseValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  return (
    <ErpLayout title="Purchase Orders" subtitle="Procurement & Requisition Workflow">
      {/* Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Purchase Orders</h2>
          <p className="subtitle">Manage vendor procurement and incoming goods.</p>
        </div>
        {hasPermission(PERMISSIONS.CREATE_PURCHASE_ORDERS) && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Create Purchase Order
          </button>
        )}
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {actionSuccess && <div className="alert alert-success mb-4">{actionSuccess}</div>}

      {/* Top 4 Summary Cards (Mandatory from Database) */}
      <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
          <div className="kpi-icon-box amber">📝</div>
          <div className="kpi-details">
            <span className="kpi-label">Draft POs</span>
            <span className="kpi-val" style={{ color: '#f57c00' }}>{draftPOCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
          <div className="kpi-icon-box blue">🚚</div>
          <div className="kpi-details">
            <span className="kpi-label">Confirmed POs</span>
            <span className="kpi-val" style={{ color: '#1e88e5' }}>{confirmedPOCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #00897b' }}>
          <div className="kpi-icon-box green">📦</div>
          <div className="kpi-details">
            <span className="kpi-label">Received</span>
            <span className="kpi-val" style={{ color: '#00897b' }}>{receivedPOCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #d32f2f' }}>
          <div className="kpi-icon-box gold">💰</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Purchase Value</span>
            <span className="kpi-val" style={{ color: '#d32f2f' }}>{formatCurrency(totalPurchaseValue)}</span>
          </div>
        </div>
      </div>

      {/* Workflow Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['ALL', 'DRAFT', 'CONFIRMED', 'RECEIVED', 'BILLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            {st === 'ALL' ? `All POs (${orders.length})` : `${st} (${orders.filter(o => o.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Procurement Orders ({filteredOrders.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading purchase orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">📦</div>
              <h3>No purchase orders found</h3>
              <p>Click "+ Create Purchase Order" to begin raw material requisition.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Order #</th>
                  <th>Vendor</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Subtotal</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Tax</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Total Amount</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ textAlign: 'right', width: '250px' }}>Procurement Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{po.orderNumber}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{po.vendor?.name || '—'}</strong>
                      {po.vendor?.city && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{po.vendor.city}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(po.date)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(po.subtotal)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(po.tax)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#d32f2f' }}>
                      {formatCurrency(po.total)}
                    </td>
                    <td>
                      <span className={`badge ${
                        po.status === 'RECEIVED' ? 'badge-sales' :
                        po.status === 'BILLED' ? 'badge-active' :
                        po.status === 'CONFIRMED' ? 'badge-admin' : 'badge-warning'
                      }`}>
                        {po.status === 'DRAFT' ? 'AWAITING ADMIN APPROVAL' : po.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewOrder(po)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          👁️ View
                        </button>
                        {po.status === 'DRAFT' && user?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(po.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            Confirm PO
                          </button>
                        )}
                        {po.status === 'CONFIRMED' && user?.role === 'ACCOUNTANT' && user?.accountantType === 'PURCHASE' && (
                          <button
                            type="button"
                            onClick={() => handleReceiveGoods(po.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#00897b' }}
                          >
                            📦 Mark as Received
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => handleCreateBill(po.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            📑 Create Bill
                          </button>
                        )}
                        {po.status === 'BILLED' && (
                          <span style={{ fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600 }}>
                            ✓ Billed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View PO Details Modal */}
      {viewOrder && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3>Purchase Order Details</h3>
                <p className="modal-subtitle">{viewOrder.orderNumber} — Status: {viewOrder.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Vendor:</strong> {viewOrder.vendor?.name}</div>
                <div><strong>Date:</strong> {formatDate(viewOrder.date)}</div>
                <div><strong>Status:</strong> <span className="badge badge-active">{viewOrder.status}</span></div>
                <div><strong>Notes:</strong> {viewOrder.notes || '—'}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Procured Material Lines:</h4>
            <table className="erp-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Material / Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product?.name || it.description}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'var(--bg-primary)', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Subtotal:</span>
                <strong>{formatCurrency(viewOrder.subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Tax:</span>
                <strong>{formatCurrency(viewOrder.tax)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: '#d32f2f' }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              {viewOrder.status === 'RECEIVED' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = viewOrder.id;
                    setViewOrder(null);
                    handleCreateBill(id);
                  }}
                  className="btn btn-primary"
                >
                  Generate Vendor Bill →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3>Create Purchase Order</h3>
                <p className="modal-subtitle">Requisition furniture components and raw materials from vendor</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}

            <form onSubmit={handleCreateOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vendor (Contact Master) *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="form-input"
                    style={{ height: '48px' }}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.type}) {v.city ? `- ${v.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Procurement Reference / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Factory delivery order for batch production"
                  className="form-input"
                />
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>
                Products / Materials (Product Master)
              </h4>

              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 80px 110px 80px 36px',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '10px',
                    background: 'var(--bg-primary)',
                    padding: '10px',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      Product *
                    </label>
                    <select
                      value={it.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="form-input"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Cost: ₹{p.costPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      Qty *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                      className="form-input"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      Unit Cost (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                      className="form-input"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      Tax %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={it.taxRate}
                      onChange={(e) => handleItemFieldChange(idx, 'taxRate', e.target.value)}
                      className="form-input"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={items.length <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: items.length <= 1 ? 'var(--text-muted)' : '#c0392b',
                        cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1.1rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddLine}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', marginBottom: '20px' }}
              >
                + Add Another Product Line
              </button>

              <div
                style={{
                  background: 'var(--bg-primary)',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  marginBottom: '24px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(calculatedSubtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span>Tax:</span>
                  <strong>{formatCurrency(calculatedTax)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#d32f2f',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Creating Order...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default PurchaseOrdersPage;

