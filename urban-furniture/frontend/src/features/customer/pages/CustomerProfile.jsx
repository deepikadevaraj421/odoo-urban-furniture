import { useState, useEffect, useCallback } from 'react';
import '../customer.css';
import { CustomerSidebar, CustomerHeader } from '../components/CustomerNav';
import customerApi from '../../../services/customerApi';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import { useNavigate } from 'react-router-dom';

const MOCK_PROFILE = { name: 'Deepika D', customerCode: 'CUST-00028', email: 'deepikadevaraj413@gmail.com', mobile: '9876543210', address: '12, MG Road, Chennai - 600001', status: 'ACTIVE' };

const THEME_KEY = 'cp_theme';

const CustomerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); localStorage.setItem(THEME_KEY, next);
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.getProfile();
      const c = res.data.customer;
      setProfile(c);
      setMobile(c.mobile || '');
      setAddress(c.address || '');
      setDemoMode(false);
    } catch {
      const mock = { ...MOCK_PROFILE, email: user?.email || MOCK_PROFILE.email, name: user?.name || MOCK_PROFILE.name };
      setProfile(mock);
      setMobile(mock.mobile);
      setAddress(mock.address);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (demoMode) { setEditing(false); setSuccessMsg('Profile updated! (Demo mode — changes not persisted)'); setTimeout(() => setSuccessMsg(''), 4000); return; }
    setSaving(true);
    setError('');
    try {
      await customerApi.updateProfile({ mobile, address });
      setSuccessMsg('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`cp-root ${theme === 'dark' ? 'cp-dark' : ''}`}>
      <div className="cp-layout">
        <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="cp-main">
          <CustomerHeader onToggleSidebar={() => setSidebarOpen(p => !p)} theme={theme} onToggleTheme={toggleTheme} />
          <main className="cp-page" id="cp-profile-page">
            <div className="cp-page-header"><h1 className="cp-page-title">My Profile</h1></div>

            {demoMode && (
              <div style={{ background: '#fef3cd', border: '1px solid #f0c040', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92650a' }}>
                🎭 <strong>Demo Mode</strong> — Showing sample data. Connect PostgreSQL to see live data.
              </div>
            )}
            {error && <div className="cp-error-box">⚠️ {error}</div>}
            {successMsg && <div className="cp-alert success">✅ {successMsg}</div>}

            {loading ? (
              <div className="cp-section-card" style={{ padding: 24 }}>
                {[1,2,3,4].map(i => <div key={i} className="cp-skeleton" style={{ height: 40, marginBottom: 16, borderRadius: 8 }} />)}
              </div>
            ) : profile && (
              <div className="cp-section-card" style={{ maxWidth: 640 }}>
                <div className="cp-section-header">
                  <h2 className="cp-section-title">Personal Information</h2>
                  {!editing ? (
                    <button className="cp-edit-btn" onClick={() => setEditing(true)} id="cp-profile-edit-btn">✏️ Edit Profile</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="cp-btn cp-btn-outline" onClick={() => { setEditing(false); setMobile(profile.mobile || ''); setAddress(profile.address || ''); }} style={{ padding: '4px 12px', fontSize: '0.8rem' }} id="cp-cancel-edit-btn">Cancel</button>
                      <button className="cp-btn cp-btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '4px 12px', fontSize: '0.8rem' }} id="cp-save-profile-btn">{saving ? 'Saving...' : '💾 Save'}</button>
                    </div>
                  )}
                </div>
                <div style={{ padding: 24 }}>
                  {/* Avatar */}
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #52b788, #2d6a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                      {getInitials(profile.name)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--cp-text-primary)', marginBottom: 4 }}>{profile.name}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cp-green)' }}>{profile.customerCode}</div>
                      <span style={{ background: 'var(--cp-green-pale)', color: 'var(--cp-green)', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, display: 'inline-block', marginTop: 6 }}>{profile.status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[{ label: 'Full Name', val: profile.name }, { label: 'Email Address', val: profile.email || user?.email }, { label: 'Customer ID', val: profile.customerCode }].map(({ label, val }) => (
                      <div key={label} className="cp-form-group" style={{ marginBottom: 0 }}>
                        <label className="cp-form-label">{label}</label>
                        <div style={{ padding: '10px 14px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--cp-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {val} <span style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>🔒 Read-only</span>
                        </div>
                      </div>
                    ))}

                    <div className="cp-form-group" style={{ marginBottom: 0 }}>
                      <label className="cp-form-label" htmlFor="cp-profile-mobile">Mobile Number</label>
                      {editing ? (
                        <input id="cp-profile-mobile" type="tel" className="cp-form-input" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Enter mobile number" />
                      ) : (
                        <div style={{ padding: '10px 14px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--cp-text-secondary)' }}>{profile.mobile || '—'}</div>
                      )}
                    </div>

                    <div className="cp-form-group" style={{ marginBottom: 0 }}>
                      <label className="cp-form-label" htmlFor="cp-profile-address">Address</label>
                      {editing ? (
                        <input id="cp-profile-address" type="text" className="cp-form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address" />
                      ) : (
                        <div style={{ padding: '10px 14px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--cp-text-secondary)' }}>{profile.address || '—'}</div>
                      )}
                    </div>
                  </div>

                  {!editing && (
                    <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--cp-amber-pale)', border: '1px solid rgba(212,132,10,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--cp-amber)' }}>
                      💡 You can edit your mobile number and address. Name, email, and Customer ID are managed by Urban Furniture administration.
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
          <footer className="cp-footer">
            <span>© 2025 Urban Furniture. All rights reserved.</span>
            <div className="cp-footer-links"><span className="cp-footer-link">Privacy</span><span className="cp-footer-link">Terms</span><span className="cp-footer-link">Support</span></div>
          </footer>
        </div>
        <button className="cp-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="Open navigation" id="cp-mobile-menu-profile" style={{ display: 'flex' }}>☰</button>
      </div>
    </div>
  );
};

export default CustomerProfile;
