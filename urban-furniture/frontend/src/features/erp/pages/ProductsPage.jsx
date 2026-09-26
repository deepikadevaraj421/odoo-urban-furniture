import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import erpApi from '../../../services/erpApi';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// Furniture icon mapping helper
const getCategoryIcon = (category, type) => {
  if (type === 'SERVICE') return '🛠️';
  if (type === 'COMBO') return '📦';
  const cat = (category || '').toLowerCase();
  if (cat.includes('chair')) return '🪑';
  if (cat.includes('table') || cat.includes('desk')) return '🪵';
  if (cat.includes('sofa')) return '🛋️';
  if (cat.includes('bed')) return '🛏️';
  if (cat.includes('storage') || cat.includes('shelf') || cat.includes('wardrobe')) return '🚪';
  if (cat.includes('office')) return '💼';
  if (cat.includes('outdoor')) return '🪴';
  return '🛋️';
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const autoNew = searchParams.get('action') === 'new';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(autoNew);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Form states for Add
  const [formData, setFormData] = useState({
    name: '',
    type: 'GOODS',
    category: 'Chairs',
    salesPrice: '',
    costPrice: '',
  });

  // Form states for Edit
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'GOODS',
    category: 'Chairs',
    salesPrice: '',
    costPrice: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterType !== 'ALL') params.type = filterType;
      if (filterCategory !== 'ALL') params.category = filterCategory;
      const res = await erpApi.getProducts(params);
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts();
  }, [search, filterType, filterCategory]);

  // Extract unique categories for the dropdown filter
  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Client-side pagination calculations
  const totalRecords = products.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedProducts = useMemo(() => {
    return products.slice(startIndex, endIndex);
  }, [products, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.createProduct(formData);
      setModalSuccess('Product created successfully!');
      setFormData({
        name: '',
        type: 'GOODS',
        category: 'Chairs',
        salesPrice: '',
        costPrice: '',
      });
      fetchProducts();
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      type: product.type || 'GOODS',
      category: product.category || 'Furniture',
      salesPrice: product.salesPrice ?? '',
      costPrice: product.costPrice ?? '',
      status: product.status || 'ACTIVE',
    });
    setModalError('');
    setModalSuccess('');
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      await erpApi.updateProduct(editingProduct.id, editFormData);
      setModalSuccess('Product updated successfully!');
      fetchProducts();
      setTimeout(() => {
        setEditingProduct(null);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      await erpApi.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProductCode = (p) => {
    if (p.code) return p.code;
    const cleanId = (p.id || '').replace(/-/g, '').slice(0, 5).toUpperCase();
    return `PRD-${cleanId || '00000'}`;
  };

  return (
    <ErpLayout title="Product Catalogue" subtitle="Urban Furniture Inventory & Pricing">
      {/* Top Header & Breadcrumb */}
      <div className="master-header-row">
        <div>
          <div className="master-breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span>Products</span>
            <span>&gt;</span>
            <span className="crumb-active">Product Catalogue</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Product Master
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Manage furniture items, manufacturing costs, and sales prices
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add New Product
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="card customer-search-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by Name, Category, or Code..."
            className="form-input search-field"
          />
        </div>

        {/* Type Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Types' },
            { key: 'GOODS', label: 'Goods' },
            { key: 'SERVICE', label: 'Services' },
            { key: 'COMBO', label: 'Combos' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab-btn ${filterType === t.key ? 'active' : ''}`}
              onClick={() => setFilterType(t.key)}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        {categoriesList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="master-select-compact"
              style={{ height: '44px', padding: '0 14px' }}
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Unified Master Table Card */}
      <div className="master-table-card">
        {/* Table Toolbar */}
        <div className="master-toolbar">
          <div className="master-records-count">
            <span>Product Records</span>
            <span className="count-pill">{totalRecords}</span>
          </div>
          <div className="master-entries-selector">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="master-select-compact"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Table Scroll View */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading products from PostgreSQL database...
            </div>
          ) : totalRecords === 0 ? (
            <div className="empty-state" style={{ margin: '40px auto' }}>
              <div className="empty-state-icon">🛋️</div>
              <h3>No products found</h3>
              <p>Click "+ Add New Product" to start building your catalogue.</p>
            </div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '54px', textAlign: 'center' }}>Image</th>
                  <th style={{ minWidth: '180px' }}>Product Name</th>
                  <th style={{ minWidth: '110px' }}>Product Code</th>
                  <th style={{ minWidth: '95px' }}>Type</th>
                  <th style={{ minWidth: '120px' }}>Category</th>
                  <th style={{ minWidth: '115px', textAlign: 'right' }}>Sales Price</th>
                  <th style={{ minWidth: '115px', textAlign: 'right' }}>Cost Price</th>
                  <th style={{ minWidth: '160px', textAlign: 'right' }}>Gross Margin</th>
                  <th style={{ minWidth: '95px' }}>Status</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p, index) => {
                  const rowNumber = startIndex + index + 1;
                  const margin = p.salesPrice - p.costPrice;
                  const marginPercent =
                    p.salesPrice > 0 ? Math.round((margin / p.salesPrice) * 100) : 0;
                  const isPositive = margin >= 0;

                  return (
                    <tr key={p.id}>
                      <td className="table-index-cell" style={{ textAlign: 'center' }}>
                        {rowNumber}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="product-thumb-box">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          ) : (
                            getCategoryIcon(p.category, p.type)
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "'SF Mono', Consolas, monospace",
                            fontSize: '0.82rem',
                            color: 'var(--accent)',
                            fontWeight: 700,
                          }}
                        >
                          {getProductCode(p)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.type === 'GOODS'
                              ? 'badge-admin'
                              : p.type === 'SERVICE'
                              ? 'badge-purchase'
                              : 'badge-gold'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(p.salesPrice)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: 'var(--text-muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`margin-badge ${
                            isPositive ? 'margin-positive' : 'margin-negative'
                          }`}
                        >
                          {formatCurrency(margin)} ({marginPercent}%)
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-active">{p.status || 'ACTIVE'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="View Product"
                            onClick={() => setViewingProduct(p)}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="Edit Product"
                            onClick={() => openEditModal(p)}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon btn-delete"
                            title="Delete Product"
                            onClick={() => setDeletingProduct(p)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalRecords > 0 && (
          <div className="master-pagination-bar">
            <div className="master-pagination-info">
              Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
              <strong>{totalRecords}</strong> entries
            </div>
            <div className="master-pagination-nav">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && p - prevPage > 1;
                  return (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {hasGap && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>}
                      <button
                        type="button"
                        className={`page-nav-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Product Modal ────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Add Product to Catalogue</h3>
                <p className="modal-subtitle">Define furniture specifications and pricing</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
            {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ergonomic Office Chair"
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="GOODS">Goods</option>
                    <option value="SERVICE">Service</option>
                    <option value="COMBO">Combo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Chairs, Tables, Sofas"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salesPrice"
                    value={formData.salesPrice}
                    onChange={handleInputChange}
                    placeholder="4500"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost / Purchase Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    placeholder="2800"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Product Modal ───────────────────────────── */}
      {viewingProduct && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Product Specifications</h3>
                <p className="modal-subtitle">Full master record from PostgreSQL database</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="product-thumb-box" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                    {getCategoryIcon(viewingProduct.category, viewingProduct.type)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{viewingProduct.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Code: {getProductCode(viewingProduct)}
                    </span>
                  </div>
                </div>
                <span className="badge badge-active">{viewingProduct.status || 'ACTIVE'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{viewingProduct.type}</p>
                </div>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{viewingProduct.category}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Price</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(viewingProduct.salesPrice)}
                  </p>
                </div>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cost Price</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                    {formatCurrency(viewingProduct.costPrice)}
                  </p>
                </div>
                <div className="detail-box">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Margin</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '1.1rem', color: viewingProduct.salesPrice >= viewingProduct.costPrice ? 'var(--success)' : 'var(--error)' }}>
                    {formatCurrency((viewingProduct.salesPrice - viewingProduct.costPrice))}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ───────────────────────────── */}
      {editingProduct && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Edit Product</h3>
                <p className="modal-subtitle">Update pricing and item details in PostgreSQL</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-error mb-4">{modalError}</div>}
            {modalSuccess && <div className="alert alert-success mb-4">{modalSuccess}</div>}

            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Type *</label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="GOODS">Goods</option>
                    <option value="SERVICE">Service</option>
                    <option value="COMBO">Combo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="form-input"
                    style={{ height: '48px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditInputChange}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salesPrice"
                    value={editFormData.salesPrice}
                    onChange={handleEditInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost / Purchase Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={editFormData.costPrice}
                    onChange={handleEditInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────── */}
      {deletingProduct && (
        <div className="modal-overlay customer-modal">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--error)' }}>Delete Product</h3>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '16px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action will remove the item from the product catalogue in PostgreSQL.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteProduct}
                className="btn"
                style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default ProductsPage;

