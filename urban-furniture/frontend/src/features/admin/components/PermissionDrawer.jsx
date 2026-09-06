import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/authApi';
import { PERMISSION_GROUPS } from '../../../utils/permissionConstants';

const PermissionDrawer = ({ isOpen, accountant, onClose, onPermissionsSaved }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (accountant) {
      setSelectedPermissions(accountant.permissions || []);
      setError('');
      setSuccess('');
    }
  }, [accountant, isOpen]);

  if (!isOpen || !accountant) return null;

  const handleToggle = (permKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  const handleToggleAllInGroup = (group) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !groupKeys.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupKeys])));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminApi.updateAccountantPermissions(
        accountant.id,
        selectedPermissions
      );

      setSuccess('Permissions successfully saved to database!');
      if (onPermissionsSaved) {
        onPermissionsSaved(response.data.accountant);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to persist permissions to database. Please check your connection and retry.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: 'var(--bg-secondary, #161b22)',
          color: 'var(--text-primary, #f0f6fc)',
          borderLeft: '1px solid var(--border, #30363d)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #30363d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-primary, #0d1117)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🔐</span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Manage Permissions
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #8b949e)' }}>
              Configure granular access control for this accountant
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #8b949e)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(88, 166, 255, 0.08)',
            borderBottom: '1px solid rgba(88, 166, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <span style={{ fontSize: '0.82rem', color: '#58a6ff', lineHeight: 1.4 }}>
            <strong>Security Notice:</strong> These permissions control what this accountant can access. Changes persist immediately in PostgreSQL and are enforced at the backend API layer.
          </span>
        </div>

        {/* Selected Accountant Profile Card */}
        <div
          style={{
            padding: '16px 20px',
            margin: '16px 20px 0',
            background: 'var(--bg-primary, #0d1117)',
            borderRadius: '10px',
            border: '1px solid var(--border, #30363d)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #f0f6fc)' }}>
                {accountant.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #8b949e)' }}>
                {accountant.email}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: accountant.accountantType === 'SALES' ? 'rgba(46, 160, 67, 0.15)' : 'rgba(219, 109, 40, 0.15)',
                  color: accountant.accountantType === 'SALES' ? '#3fb950' : '#f0883e',
                  border: `1px solid ${accountant.accountantType === 'SALES' ? 'rgba(46, 160, 67, 0.3)' : 'rgba(219, 109, 40, 0.3)'}`,
                }}
              >
                {accountant.accountantType} ACCOUNTANT
              </span>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: accountant.status === 'ACTIVE' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(227, 179, 65, 0.2)',
                  color: accountant.status === 'ACTIVE' ? '#3fb950' : '#d29922',
                }}
              >
                {accountant.status}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border, #30363d)',
              fontSize: '0.76rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted, #8b949e)' }}>Accountant ID:</span>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{accountant.accountantCode || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #8b949e)' }}>Employee ID:</span>
              <div style={{ fontWeight: 600 }}>{accountant.employeeId || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #8b949e)' }}>Department:</span>
              <div style={{ fontWeight: 600 }}>{accountant.department || 'Accounting'}</div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div
            style={{
              margin: '12px 20px 0',
              padding: '10px 14px',
              background: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid rgba(248, 81, 73, 0.4)',
              borderRadius: '8px',
              color: '#f85149',
              fontSize: '0.82rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              margin: '12px 20px 0',
              padding: '10px 14px',
              background: 'rgba(46, 160, 67, 0.15)',
              border: '1px solid rgba(46, 160, 67, 0.4)',
              borderRadius: '8px',
              color: '#3fb950',
              fontSize: '0.82rem',
            }}
          >
            ✅ {success}
          </div>
        )}

        {/* Scrollable Permission Groups */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {PERMISSION_GROUPS.map((group) => {
            const groupKeys = group.permissions.map((p) => p.key);
            const activeCount = groupKeys.filter((k) => selectedPermissions.includes(k)).length;
            const allActive = activeCount === groupKeys.length;

            return (
              <div
                key={group.key}
                style={{
                  background: 'var(--bg-primary, #0d1117)',
                  border: '1px solid var(--border, #30363d)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--border, #30363d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{group.icon}</span>
                    <strong style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                      {group.title}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: activeCount > 0 ? 'rgba(56, 139, 253, 0.15)' : 'rgba(110, 118, 129, 0.15)',
                        color: activeCount > 0 ? '#58a6ff' : 'var(--text-muted, #8b949e)',
                      }}
                    >
                      {activeCount} / {groupKeys.length} enabled
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAllInGroup(group)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border, #30363d)',
                      color: 'var(--text-secondary, #8b949e)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {allActive ? 'Disable All' : 'Enable All'}
                  </button>
                </div>

                {/* Group Items */}
                <div style={{ padding: '8px 16px' }}>
                  {group.permissions.map((perm) => {
                    const isEnabled = selectedPermissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <div style={{ paddingRight: '12px', flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              color: isEnabled ? 'var(--text-primary, #f0f6fc)' : 'var(--text-muted, #8b949e)',
                            }}
                          >
                            {perm.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #8b949e)', marginTop: '2px' }}>
                            {perm.detail}
                          </div>
                        </div>

                        {/* ON / OFF Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle(perm.key)}
                          aria-label={`Toggle ${perm.label}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            border: `1px solid ${isEnabled ? '#2ea043' : '#30363d'}`,
                            background: isEnabled ? 'rgba(46, 160, 67, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: isEnabled ? '#3fb950' : '#6e7681',
                              boxShadow: isEnabled ? '0 0 6px #2ea043' : 'none',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: isEnabled ? '#3fb950' : '#8b949e',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {isEnabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border, #30363d)',
            background: 'var(--bg-primary, #0d1117)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b949e)' }}>
            Total Enabled: <strong>{selectedPermissions.length}</strong> permissions
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDrawer;
