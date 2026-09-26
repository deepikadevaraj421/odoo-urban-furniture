import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { customerApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { useAuth } from '../../../context/AuthContext';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const SalesOrdersPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Order Form
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', description: '', quantity: 5, unitPrice: 0, taxRate: 5 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setCustomersLoading(true);
    setError('');
    try {
      const [soRes, cRes, pRes] = await Promise.all([
        erpApi.getSalesOrders(),
        customerApi.getCustomers('', user?.role === 'ACCOUNTANT' ? 'accountant' : 'admin'),
        erpApi.getProducts(),
      ]);
      setOrders(soRes.data.orders || []);
      
      const eligibleCustomers = (cRes.data.customers || [])
        .filter((customer) => customer.status === 'ACTIVE' && customer.contactId)
        .map((customer) => ({ ...customer, id: customer.contactId }));
      setCustomers(eligibleCustomers);
      setProducts(pRes.data.products || []);
    } catch (err) {
      setCustomers([]);
      setError(err.response?.data?.message || 'Unable to load customers.');
    } finally {
      setLoading(false);
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        description: prod ? prod.name : '',
        unitPrice: prod ? prod.salesPrice : 0,
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
      { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 5 },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    setCustomerId('');
    setCustomerSearch('');
    setItems([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
    setShowModal(true);
  };

  // Live Calculations for UI
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
      await erpApi.createSalesOrder({
        customerId,
        date,
        notes,
        items,
      });
      setShowModal(false);
      setActionSuccess('Sales Order created successfully in database!');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create sales order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await erpApi.confirmSalesOrder(orderId);
      setActionSuccess('Sales Order confirmed! Ready for customer invoicing.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm order.');
    }
  };

  const handleCreateInvoice = async (orderId) => {
    try {
      const res = await erpApi.createInvoiceFromOrder(orderId);
      setActionSuccess(res.data.message || 'Customer Invoice generated successfully from Sales Order!');
      setTimeout(() => {
        setActionSuccess('');
        navigate(ROUTES.CUSTOMER_INVOICES_MGMT);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice.');
    }
  };

  // Real Database Totals for KPI Summary Cards
  const draftOrdersCount = orders.filter((o) => o.status === 'DRAFT').length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const invoicedOrdersCount = orders.filter((o) => o.status === 'INVOICED').length;
  const totalOrderValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);
  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return true;
    return [customer.name, customer.email, customer.mobile, customer.customerCode, customer.contactId].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
  });
  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  return (
    <ErpLayout title="Sales Orders" subtitle="Sales Pipeline & Order Workspace">
      {/* Header */}
      <div className="customer-dir-title-row">
        <div>
          <h2>Sales Orders</h2>
          <p className="subtitle">Manage customer orders and convert them into invoices.</p>
        </div>
        {hasPermission(PERMISSIONS.CREATE_SALES_ORDERS) && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Create Sales Order
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
            <span className="kpi-label">Draft Orders</span>
            <span className="kpi-val" style={{ color: '#f57c00' }}>{draftOrdersCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
          <div className="kpi-icon-box blue">✓</div>
          <div className="kpi-details">
            <span className="kpi-label">Confirmed Orders</span>
            <span className="kpi-val" style={{ color: '#1e88e5' }}>{confirmedOrdersCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
          <div className="kpi-icon-box green">🧾</div>
          <div className="kpi-details">
            <span className="kpi-label">Invoiced Orders</span>
            <span className="kpi-val" style={{ color: '#2e7d32' }}>{invoicedOrdersCount}</span>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="kpi-icon-box gold">💰</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Order Value</span>
            <span className="kpi-val" style={{ color: 'var(--accent)' }}>{formatCurrency(totalOrderValue)}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['ALL', 'DRAFT', 'CONFIRMED', 'INVOICED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            {st === 'ALL' ? `All Orders (${orders.length})` : `${st} (${orders.filter(o => o.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Sales Orders Workspace Table */}
      <div className="erp-card-table">
        <div className="erp-table-header">
          <h3>Customer Sales Pipeline ({filteredOrders.length})</h3>
        </div>
        <div className="erp-table-scroll">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading sales orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">🛍️</div>
              <h3>No sales orders in this stage</h3>
              <p>Click "+ Create Sales Order" to start a new customer order flow.</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Order #</th>
                  <th>Customer</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Subtotal</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Tax</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Grand Total</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ textAlign: 'right', width: '240px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((so) => (
                  <tr key={so.id}>
                    <td>
                      <span className="customer-code" style={{ fontWeight: 700 }}>{so.orderNumber}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{so.customer?.name || '—'}</strong>
                      {so.customer?.email && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{so.customer.email}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(so.date)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(so.subtotal)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(so.tax)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrency(so.total)}
                    </td>
                    <td>
                      <span className={`badge ${
                        so.status === 'CONFIRMED' ? 'badge-active' :
                        so.status === 'INVOICED' ? 'badge-sales' :
                        so.status === 'CANCELLED' ? 'badge-warning' : 'badge-admin'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewOrder(so)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          👁️ View
                        </button>
                        {so.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(so.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#2e7d32', color: '#fff', border: 'none' }}
                          >
                            Confirm
                          </button>
                        )}
                        {so.status === 'CONFIRMED' && hasPermission(PERMISSIONS.CREATE_CUSTOMER_INVOICES) && (
                          <button
                            type="button"
                            onClick={() => handleCreateInvoice(so.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            🧾 Generate Invoice
                          </button>
                        )}
                        {so.status === 'INVOICED' && (
                          <span style={{ fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600 }}>
                            ✓ Invoiced
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

      {/* View Order Modal */}
      {viewOrder && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3>Sales Order Details</h3>
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
                <div><strong>Customer:</strong> {viewOrder.customer?.name}</div>
                <div><strong>Date:</strong> {formatDate(viewOrder.date)}</div>
                <div><strong>Email:</strong> {viewOrder.customer?.email || '—'}</div>
                <div><strong>Mobile:</strong> {viewOrder.customer?.mobile || '—'}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Order Line Items:</h4>
            <table className="erp-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Product / Description</th>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)' }}>
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
              {viewOrder.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = viewOrder.id;
                    setViewOrder(null);
                    handleCreateInvoice(id);
                  }}
                  className="btn btn-primary"
                >
                  Generate Customer Invoice →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Sales Order Modal */}
      {showModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3>Create Sales Order</h3>
                <p className="modal-subtitle">Register a customer quotation and order pipeline</p>
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
                  <label className="form-label">Search Customer (name, email, ID, mobile)</label>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="form-input"
                    placeholder="Search existing customer master"
                  />
                  <label className="form-label" style={{ marginTop: '10px' }}>Customer *</label>
                  {customersLoading && <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading customers...</div>}
                  {!customersLoading && !error && filteredCustomers.length === 0 && (
                    <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No customers available.</div>
                  )}
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="form-input"
                    style={{ height: '48px' }}
                    required
                    disabled={customersLoading || filteredCustomers.length === 0}
                  >
                    <option value="">-- Select Customer --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.customerCode}
                      </option>
                    ))}
                  </select>
                  {customerSearch && filteredCustomers.length === 0 && (
                    <div style={{ marginTop: '8px', color: 'var(--error)', fontSize: '0.8rem' }}>
                      Customer not found. <button type="button" className="btn-link" onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}>Create New Customer</button>
                    </div>
                  )}
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

              {selectedCustomer && (
                <div style={{ marginBottom: '16px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-primary)', fontSize: '0.84rem' }}>
                  <strong>{selectedCustomer.name}</strong> · Customer ID: {selectedCustomer.customerCode || '—'}<br />
                  {selectedCustomer.email || '—'} · {selectedCustomer.mobile || '—'}
                </div>
              )}

              <div className="form-group mb-4">
                <label className="form-label">Order Notes / Terms</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard 30-day delivery to showroom warehouse"
                  className="form-input"
                />
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>
                Product Line Items (Product Master)
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
                          {p.name} (₹{p.salesPrice})
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
                      Unit Price (₹) *
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
                      title="Remove line"
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

              {/* Order Calculations Summary */}
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
                  <span>Estimated Tax:</span>
                  <strong>{formatCurrency(calculatedTax)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
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
                  {submitting ? 'Creating Order...' : 'Create Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default SalesOrdersPage;

