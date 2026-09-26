import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import { PERMISSIONS } from '../../utils/permissionConstants';

const ErpSidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const role = user?.role;
  const accountantType = user?.accountantType;

  return (
    <aside className={`erp-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="erp-sidebar-header">
        <div className="erp-brand-logo">UF</div>
        <div className="erp-brand-text">
          <h2>Urban Furniture</h2>
          <span>ERP Platform</span>
        </div>
        <button
          type="button"
          className="erp-sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <div className="erp-sidebar-body">
        {/* ==============================================
            ADMIN SIDEBAR
            ============================================== */}
        {role === 'ADMIN' && (
          <>
            <div className="sidebar-group">
              <NavLink
                to={ROUTES.ADMIN_DASHBOARD}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📊</span> Dashboard
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">MASTER DATA</span>
              <NavLink to={ROUTES.CONTACTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">👥</span> Contacts
              </NavLink>
              <NavLink to={ROUTES.PRODUCTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🛋️</span> Products
              </NavLink>
              <NavLink to={ROUTES.CHART_OF_ACCOUNTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📑</span> Chart of Accounts
              </NavLink>
              <NavLink to={ROUTES.JOURNALS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📚</span> Journals
              </NavLink>
              <NavLink to={ROUTES.ANALYTIC_ACCOUNTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📈</span> Analytic Accounts
              </NavLink>
              <NavLink to={ROUTES.BUDGETS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🎯</span> Budgets
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">TRANSACTIONS</span>
              <NavLink to={ROUTES.SALES_ORDERS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🛍️</span> Sales Orders
              </NavLink>
              <NavLink to={ROUTES.CUSTOMER_INVOICES_MGMT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🧾</span> Customer Invoices
              </NavLink>
              <NavLink to={ROUTES.PURCHASE_ORDERS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📦</span> Purchase Orders
              </NavLink>
              <NavLink to={ROUTES.VENDOR_BILLS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📑</span> Vendor Bills
              </NavLink>
              <NavLink to={ROUTES.PAYMENTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">💳</span> Payments
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">REPORTS</span>
              <NavLink to={ROUTES.BALANCE_SHEET} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🏛️</span> Balance Sheet
              </NavLink>
              <NavLink to={ROUTES.PROFIT_LOSS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📊</span> Profit & Loss
              </NavLink>
              <NavLink to={ROUTES.BUDGET_REPORT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">📉</span> Budget Report
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">USER MANAGEMENT</span>
              <NavLink to={ROUTES.ADD_ACCOUNTANT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">💼</span> Accountants
              </NavLink>
              <NavLink to={ROUTES.CUSTOMER_MANAGEMENT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🧑‍🤝‍🧑</span> Customer Directory
              </NavLink>
            </div>
          </>
        )}

        {/* ==============================================
            SALES ACCOUNTANT SIDEBAR
            ============================================== */}
        {role === 'ACCOUNTANT' && accountantType === 'SALES' && (
          <>
            <div className="sidebar-group">
              <NavLink
                to={ROUTES.SALES_DASHBOARD}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📊</span> Dashboard
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">SALES & AR</span>
              {(hasPermission(PERMISSIONS.VIEW_CUSTOMERS) || hasPermission(PERMISSIONS.VIEW_CONTACTS)) && (
                <NavLink to={ROUTES.CUSTOMER_MANAGEMENT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">👥</span> Customers
                </NavLink>
              )}
              {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                <NavLink to={ROUTES.PRODUCTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🛋️</span> Products
                </NavLink>
              )}
              {(hasPermission(PERMISSIONS.CREATE_SALES_ORDERS) || hasPermission(PERMISSIONS.VIEW_CUSTOMERS)) && (
                <NavLink to={ROUTES.SALES_ORDERS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🛍️</span> Sales Orders
                </NavLink>
              )}
              {(hasPermission(PERMISSIONS.CREATE_CUSTOMER_INVOICES) || hasPermission(PERMISSIONS.RECORD_CUSTOMER_PAYMENTS)) && (
                <NavLink to={ROUTES.CUSTOMER_INVOICES_MGMT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🧾</span> Customer Invoices
                </NavLink>
              )}
              {(hasPermission(PERMISSIONS.VIEW_CUSTOMER_PAYMENTS) || hasPermission(PERMISSIONS.RECORD_CUSTOMER_PAYMENTS)) && (
                <NavLink to={ROUTES.PAYMENTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">💳</span> Payments
                </NavLink>
              )}
            </div>

            {(hasPermission(PERMISSIONS.VIEW_JOURNALS) || hasPermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS)) && (
              <div className="sidebar-section">
                <span className="section-title">ACCOUNTING</span>
                {hasPermission(PERMISSIONS.VIEW_JOURNALS) && (
                  <NavLink to={ROUTES.JOURNALS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <span className="icon">📚</span> Journals
                  </NavLink>
                )}
                {hasPermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS) && (
                  <NavLink to={ROUTES.CHART_OF_ACCOUNTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <span className="icon">📑</span> Chart of Accounts
                  </NavLink>
                )}
              </div>
            )}

            {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
              <div className="sidebar-section">
                <span className="section-title">REPORTS</span>
                <NavLink to={ROUTES.BALANCE_SHEET} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🏛️</span> Balance Sheet
                </NavLink>
                <NavLink to={ROUTES.PROFIT_LOSS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📊</span> Profit & Loss
                </NavLink>
                <NavLink to={ROUTES.BUDGET_REPORT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📉</span> Budget Report
                </NavLink>
              </div>
            )}

            <div className="sidebar-section">
              <span className="section-title">PROFILE</span>
              <NavLink to={ROUTES.SALES_DASHBOARD} className="sidebar-link" onClick={onClose}>
                <span className="icon">👤</span> My Profile
              </NavLink>
              <NavLink to={ROUTES.CHART_OF_ACCOUNTS} className="sidebar-link" onClick={onClose}>
                <span className="icon">⚙️</span> Settings
              </NavLink>
            </div>
          </>
        )}

        {/* ==============================================
            PURCHASE ACCOUNTANT SIDEBAR
            ============================================== */}
        {role === 'ACCOUNTANT' && accountantType === 'PURCHASE' && (
          <>
            <div className="sidebar-group">
              <NavLink
                to={ROUTES.PURCHASE_DASHBOARD}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📊</span> Dashboard
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">PURCHASE & AP</span>
              {(hasPermission(PERMISSIONS.VIEW_VENDORS) || hasPermission(PERMISSIONS.VIEW_CONTACTS)) && (
                <NavLink to={`${ROUTES.CONTACTS}?type=VENDOR`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🚚</span> Vendors
                </NavLink>
              )}
              {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                <NavLink to={ROUTES.PRODUCTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🛋️</span> Products
                </NavLink>
              )}
              {(hasPermission(PERMISSIONS.CREATE_PURCHASE_ORDERS) || hasPermission(PERMISSIONS.VIEW_VENDORS)) && (
                <NavLink to={ROUTES.PURCHASE_ORDERS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📦</span> Purchase Orders
                </NavLink>
              )}
              {hasPermission(PERMISSIONS.CREATE_VENDOR_BILLS) && (
                <NavLink to={ROUTES.VENDOR_BILLS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📑</span> Vendor Bills
                </NavLink>
              )}
              {(hasPermission(PERMISSIONS.VIEW_VENDOR_PAYMENTS) || hasPermission(PERMISSIONS.RECORD_VENDOR_PAYMENTS)) && (
                <NavLink to={ROUTES.PAYMENTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">💳</span> Payments
                </NavLink>
              )}
            </div>

            {(hasPermission(PERMISSIONS.VIEW_JOURNALS) || hasPermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS)) && (
              <div className="sidebar-section">
                <span className="section-title">ACCOUNTING</span>
                {hasPermission(PERMISSIONS.VIEW_JOURNALS) && (
                  <NavLink to={ROUTES.JOURNALS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <span className="icon">📚</span> Journals
                  </NavLink>
                )}
                {hasPermission(PERMISSIONS.VIEW_CHART_OF_ACCOUNTS) && (
                  <NavLink to={ROUTES.CHART_OF_ACCOUNTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <span className="icon">📑</span> Chart of Accounts
                  </NavLink>
                )}
                {hasPermission(PERMISSIONS.VIEW_JOURNALS) && (
                  <NavLink to={ROUTES.JOURNAL_ENTRIES} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <span className="icon">✍️</span> Journal Entries
                  </NavLink>
                )}
              </div>
            )}

            {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
              <div className="sidebar-section">
                <span className="section-title">REPORTS</span>
                <NavLink to={ROUTES.BALANCE_SHEET} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">🏛️</span> Balance Sheet
                </NavLink>
                <NavLink to={ROUTES.PROFIT_LOSS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📊</span> Profit & Loss
                </NavLink>
                <NavLink to={ROUTES.BUDGET_REPORT} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <span className="icon">📉</span> Budget Report
                </NavLink>
              </div>
            )}

            <div className="sidebar-section">
              <span className="section-title">PROFILE</span>
              <NavLink to={ROUTES.PURCHASE_DASHBOARD} className="sidebar-link" onClick={onClose}>
                <span className="icon">👤</span> My Profile
              </NavLink>
              <NavLink to={ROUTES.CHART_OF_ACCOUNTS} className="sidebar-link" onClick={onClose}>
                <span className="icon">⚙️</span> Settings
              </NavLink>
            </div>
          </>
        )}

        {/* ==============================================
            CUSTOMER SIDEBAR
            ============================================== */}
        {role === 'CUSTOMER' && (
          <>
            <div className="sidebar-group">
              <NavLink
                to={ROUTES.CUSTOMER_DASHBOARD}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">🏠</span> Dashboard
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">MY ACCOUNT</span>
              <NavLink to={ROUTES.CUSTOMER_PROFILE} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">👤</span> My Profile
              </NavLink>
            </div>

            <div className="sidebar-section">
              <span className="section-title">MY TRANSACTIONS</span>
              <NavLink to={ROUTES.CUSTOMER_INVOICES} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">🧾</span> My Invoices
              </NavLink>
              <NavLink to={ROUTES.CUSTOMER_PAYMENTS} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span className="icon">💳</span> My Payments
              </NavLink>
            </div>
          </>
        )}
      </div>

      <div className="erp-sidebar-footer">
        <button onClick={handleLogout} className="btn-sidebar-logout">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default ErpSidebar;
