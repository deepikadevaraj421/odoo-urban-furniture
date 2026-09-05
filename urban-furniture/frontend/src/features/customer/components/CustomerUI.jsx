/* Skeleton loader and summary card components */

export const SkeletonCard = () => (
  <div className="cp-skeleton-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <div className="cp-skeleton" style={{ height: 12, width: '50%' }} />
      <div className="cp-skeleton" style={{ height: 32, width: 32, borderRadius: 8 }} />
    </div>
    <div className="cp-skeleton" style={{ height: 28, width: '60%', marginBottom: 8 }} />
    <div className="cp-skeleton" style={{ height: 10, width: '35%' }} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div style={{ padding: '0 0' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--cp-border-light)',
        alignItems: 'center',
      }}>
        <div className="cp-skeleton" style={{ height: 12, flex: 1.5 }} />
        <div className="cp-skeleton" style={{ height: 12, flex: 1 }} />
        <div className="cp-skeleton" style={{ height: 12, flex: 1 }} />
        <div className="cp-skeleton" style={{ height: 20, width: 64, borderRadius: 20 }} />
        <div className="cp-skeleton" style={{ height: 28, width: 48, borderRadius: 6 }} />
      </div>
    ))}
  </div>
);

export const SummaryCard = ({ label, value, icon, iconClass, linkText, onLink }) => (
  <div className="cp-stat-card">
    <div className="cp-stat-card-top">
      <span className="cp-stat-label">{label}</span>
      <span className={`cp-stat-icon ${iconClass}`} aria-hidden="true">{icon}</span>
    </div>
    <div className="cp-stat-value">{value}</div>
    {linkText && (
      <button className="cp-stat-link" onClick={onLink} tabIndex={0} aria-label={linkText}>
        {linkText} →
      </button>
    )}
  </div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    PAID:           { label: 'Paid',           cls: 'paid' },
    PENDING:        { label: 'Pending',         cls: 'pending' },
    OVERDUE:        { label: 'Overdue',         cls: 'overdue' },
    PARTIALLY_PAID: { label: 'Partial',         cls: 'partially' },
    CANCELLED:      { label: 'Cancelled',       cls: 'cancelled' },
    COMPLETED:      { label: 'Completed',       cls: 'paid' },
    FAILED:         { label: 'Failed',          cls: 'overdue' },
    DRAFT:          { label: 'Draft',           cls: 'pending' },
    CONFIRMED:      { label: 'Confirmed',       cls: 'paid' },
    INVOICED:       { label: 'Invoiced',        cls: 'partially' },
    ACTIVE:         { label: 'Active',          cls: 'paid' },
    CASH:           { label: 'Cash',            cls: 'pending' },
    BANK:           { label: 'Bank',            cls: 'partially' },
    ONLINE:         { label: 'Online',          cls: 'paid' },
    EMI:            { label: 'EMI',             cls: 'blue' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'cancelled' };
  return <span className={`cp-badge ${cls}`}>{label}</span>;
};

export const EmptyState = ({ icon = '📭', title, sub }) => (
  <div className="cp-empty">
    <div className="cp-empty-icon">{icon}</div>
    <div className="cp-empty-title">{title}</div>
    {sub && <div className="cp-empty-sub">{sub}</div>}
  </div>
);

export const ErrorBox = ({ message }) => (
  <div className="cp-error-box">⚠️ {message || 'Something went wrong. Please try again.'}</div>
);
