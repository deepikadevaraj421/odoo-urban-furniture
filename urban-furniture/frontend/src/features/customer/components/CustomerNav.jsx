import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import heroImg from '../../../assets/customer-hero.jpg';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',    icon: '⊞', path: ROUTES.CUSTOMER_DASHBOARD },
  { id: 'invoices',  label: 'My Invoices',  icon: '📄', path: ROUTES.CUSTOMER_INVOICES },
  { id: 'payments',  label: 'My Payments',  icon: '💳', path: ROUTES.CUSTOMER_PAYMENTS },
  { id: 'orders',    label: 'My Orders',    icon: '📦', path: ROUTES.CUSTOMER_ORDERS },
  { id: 'profile',   label: 'My Profile',   icon: '👤', path: ROUTES.CUSTOMER_PROFILE },
];

export const CustomerSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActive = () => {
    const path = location.pathname;
    if (path === ROUTES.CUSTOMER_DASHBOARD) return 'dashboard';
    if (path.startsWith('/customer/invoices')) return 'invoices';
    if (path.startsWith('/customer/payments')) return 'payments';
    if (path.startsWith('/customer/orders')) return 'orders';
    if (path.startsWith('/customer/profile')) return 'profile';
    return 'dashboard';
  };

  const active = getActive();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={onClose}
        />
      )}
      <aside className={`cp-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="cp-sidebar-header">
          <div className="cp-sidebar-logo">
            <div className="cp-sidebar-logo-icon">UF</div>
            <div className="cp-sidebar-brand-name">Urban Furniture</div>
          </div>
          <div className="cp-sidebar-portal-label">Customer Portal</div>
        </div>

        {/* Nav */}
        <nav className="cp-nav" role="navigation" aria-label="Customer portal navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`cp-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
              aria-current={active === item.id ? 'page' : undefined}
              id={`cp-nav-${item.id}`}
            >
              <span className="cp-nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="cp-sidebar-footer">
          <div className="cp-sidebar-tagline">
            Beautiful<br />Spaces<br />Brighter Lives
          </div>
          <img
            src={heroImg}
            alt="Urban Furniture showroom"
            className="cp-sidebar-furniture-img"
          />
        </div>
      </aside>
    </>
  );
};

export const CustomerHeader = ({ onToggleSidebar, theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`${ROUTES.CUSTOMER_INVOICES}?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="cp-header" role="banner">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="cp-icon-btn"
        aria-label="Toggle sidebar"
        style={{ display: 'none' }}
        id="cp-sidebar-toggle-btn"
      >
        ☰
      </button>

      {/* Search */}
      <div className="cp-search-wrap" role="search">
        <span className="cp-search-icon" aria-hidden="true">🔍</span>
        <input
          id="cp-search-input"
          type="search"
          className="cp-search-input"
          placeholder="Search invoices, orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          aria-label="Search invoices and orders"
        />
      </div>

      <div className="cp-header-actions">
        {/* Theme Toggle */}
        <button
          id="cp-theme-toggle"
          className="cp-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {/* Notifications */}
        <button className="cp-icon-btn" aria-label="Notifications" id="cp-notif-btn">
          🔔
        </button>

        {/* Profile */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="cp-user-pill"
            onClick={() => setDropdownOpen((p) => !p)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            id="cp-user-menu-btn"
          >
            <div className="cp-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <span className="cp-user-name">{user?.name?.split(' ')[0]}</span>
            <span aria-hidden="true" style={{ fontSize: '0.7rem', color: 'var(--cp-text-muted)' }}>▼</span>
          </button>

          {dropdownOpen && (
            <div className="cp-dropdown-menu" role="menu">
              <button
                className="cp-dropdown-item"
                onClick={() => { navigate(ROUTES.CUSTOMER_PROFILE); setDropdownOpen(false); }}
                role="menuitem"
                id="cp-menu-profile"
              >
                👤 My Profile
              </button>
              <button
                className="cp-dropdown-item"
                onClick={() => { navigate(ROUTES.CUSTOMER_DASHBOARD); setDropdownOpen(false); }}
                role="menuitem"
                id="cp-menu-dashboard"
              >
                ⊞ Dashboard
              </button>
              <div className="cp-dropdown-divider" />
              <button
                className="cp-dropdown-item danger"
                onClick={handleLogout}
                role="menuitem"
                id="cp-menu-logout"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
