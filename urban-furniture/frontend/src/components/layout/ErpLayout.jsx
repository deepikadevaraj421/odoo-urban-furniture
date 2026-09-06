import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import ErpSidebar from './ErpSidebar';
import ThemeToggle from '../ui/ThemeToggle';
import erpApi from '../../services/erpApi';

const ErpLayout = ({ children, title = 'Urban Furniture ERP', subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch dynamic notifications for Admin / Accountant roles
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT')) {
        try {
          const res = await erpApi.getNotifications();
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        } catch {
          // Silently fail — notifications are non-critical
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (q.includes('invoice') || q.includes('inv')) {
        navigate(ROUTES.CUSTOMER_INVOICES_MGMT);
      } else if (q.includes('order') || q.includes('so')) {
        navigate(ROUTES.SALES_ORDERS);
      } else if (q.includes('purchase') || q.includes('po')) {
        navigate(ROUTES.PURCHASE_ORDERS);
      } else if (q.includes('bill')) {
        navigate(ROUTES.VENDOR_BILLS);
      } else if (q.includes('pay')) {
        navigate(ROUTES.PAYMENTS);
      } else if (q.includes('product') || q.includes('chair') || q.includes('table') || q.includes('desk')) {
        navigate(ROUTES.PRODUCTS);
      } else if (q.includes('customer') || q.includes('client')) {
        navigate(ROUTES.CUSTOMER_MANAGEMENT);
      } else if (q.includes('vendor') || q.includes('supplier')) {
        navigate(`${ROUTES.CONTACTS}?type=VENDOR`);
      } else {
        navigate(ROUTES.CUSTOMER_MANAGEMENT);
      }
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'ADMIN')
      return <span className="badge badge-admin">ADMIN</span>;
    if (user.role === 'ACCOUNTANT') {
      const isSales = user.accountantType === 'SALES';
      return (
        <span
          className={`badge ${isSales ? 'badge-sales' : 'badge-purchase'}`}
          style={{
            fontSize: '0.72rem',
            padding: '4px 10px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            borderRadius: '20px',
            background: isSales ? 'rgba(45, 106, 79, 0.12)' : 'rgba(230, 126, 34, 0.14)',
            color: isSales ? '#2d6a4f' : '#b85c14',
          }}
        >
          {user.accountantType} ACCOUNTANT
        </span>
      );
    }
    if (user.role === 'CUSTOMER')
      return <span className="badge badge-customer">CUSTOMER</span>;
    return null;
  };

  return (
    <div className="erp-app-shell">
      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="erp-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <ErpSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Wrapper */}
      <div className="erp-main-wrapper">
        {/* Reference-Matched Topbar */}
        <header className="erp-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '68px', gap: '20px' }}>
          
          {/* LEFT: Branding */}
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
            <button
              type="button"
              className="btn-sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  letterSpacing: '-0.5px',
                  boxShadow: '0 2px 8px rgba(45, 106, 79, 0.25)',
                }}
              >
                UF
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  Urban Furniture
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  ERP PLATFORM
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Global Search */}
          <div className="topbar-center" style={{ flex: '1', maxWidth: '520px' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-input, #f4f4f2)',
                borderRadius: '12px',
                border: '1px solid var(--border, rgba(0,0,0,0.08))',
                padding: '0 14px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              className="global-search-container"
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--text-muted, #888)', marginRight: '10px', userSelect: 'none' }}>
                🔍
              </span>
              <input
                type="text"
                id="erp-global-search-input"
                placeholder="Search anything (customers, products, invoices, etc...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '9px 0',
                  fontSize: '0.86rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, rgba(0,0,0,0.1))',
                  borderRadius: '5px',
                  color: 'var(--text-muted, #888)',
                  marginLeft: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                ↵ Enter
              </span>
            </div>
          </div>

          {/* RIGHT: Theme toggle, Notifications, User avatar, Actual name, Badge, Profile dropdown, Logout */}
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />

            {/* Notifications Button */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                type="button"
                id="btn-notifications"
                onClick={() => setNotificationsOpen((v) => !v)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, rgba(0,0,0,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                title="Notifications"
                aria-label="View notifications"
              >
                🔔
                {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#e74c3c',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-surface, #fff)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border, rgba(0,0,0,0.12))',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12))',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      Notifications
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setUnreadCount(0)}
                    >
                      Mark all read
                    </span>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No payment notifications yet.
                      </div>
                    ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
                          background: n.unread ? 'var(--accent-light, rgba(74, 124, 89, 0.05))' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {n.desc}
                        </p>
                      </div>
                    ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logged in User Profile Dropdown Pill */}
            {user && (
              <div style={{ position: 'relative' }} ref={profileRef}>
                <div
                  onClick={() => setProfileDropdownOpen((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '4px 12px 4px 6px',
                    borderRadius: '30px',
                    background: 'var(--bg-card, #fff)',
                    border: '1px solid var(--border, rgba(0,0,0,0.1))',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  id="user-profile-menu-trigger"
                >
                  {/* Avatar Circle */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 6px rgba(45, 106, 79, 0.3)',
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  {/* Name and Role Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {user.name || 'Accountant'}
                    </span>
                    <div style={{ marginTop: '2px' }}>
                      {getRoleBadge()}
                    </div>
                  </div>

                  {/* Dropdown Chevron */}
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    ▼
                  </span>
                </div>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '230px',
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border, rgba(0,0,0,0.12))',
                      borderRadius: '14px',
                      boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.15))',
                      zIndex: 1000,
                      overflow: 'hidden',
                      padding: '8px 0',
                    }}
                  >
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        {user.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </p>
                    </div>

                    <div style={{ padding: '6px 0' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (user.role === 'CUSTOMER') navigate(ROUTES.CUSTOMER_PROFILE);
                          else navigate(user.accountantType === 'SALES' ? ROUTES.SALES_DASHBOARD : ROUTES.PURCHASE_DASHBOARD);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '9px 16px',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                        }}
                        className="dropdown-item-hover"
                      >
                        <span>👤</span> My Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate(ROUTES.CHART_OF_ACCOUNTS);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '9px 16px',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                        }}
                        className="dropdown-item-hover"
                      >
                        <span>⚙️</span> Settings & Preferences
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border, rgba(0,0,0,0.08))', padding: '6px 0 0' }}>
                      <button
                        type="button"
                        id="btn-profile-dropdown-logout"
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '9px 16px',
                          fontSize: '0.82rem',
                          color: '#e74c3c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        className="dropdown-item-hover"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="erp-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ErpLayout;

