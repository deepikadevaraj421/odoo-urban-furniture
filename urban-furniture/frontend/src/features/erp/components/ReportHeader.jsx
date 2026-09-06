import { useState } from 'react';

const ReportHeader = ({
  reportName,
  subtitle,
  startDate,
  endDate,
  onPeriodChange,
  onDownloadPdf,
  onPrint,
  loading = false,
}) => {
  const [activePill, setActivePill] = useState('THIS_YEAR');
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');

  const handlePillClick = (pill) => {
    setActivePill(pill);
    const now = new Date();
    const year = now.getFullYear();

    let start = '';
    let end = now.toISOString().split('T')[0];

    if (pill === 'TODAY') {
      start = end;
    } else if (pill === 'THIS_MONTH') {
      const firstDay = new Date(year, now.getMonth(), 1);
      start = firstDay.toISOString().split('T')[0];
    } else if (pill === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDayQuarter = new Date(year, currentQuarter * 3, 1);
      start = firstDayQuarter.toISOString().split('T')[0];
    } else if (pill === 'THIS_YEAR') {
      start = `${year}-01-01`;
    } else if (pill === 'CUSTOM') {
      // Keep existing custom inputs
      return;
    }

    onPeriodChange(start, end, pill);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onPeriodChange(customStart, customEnd, 'CUSTOM');
    }
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return 'Beginning';
    try {
      return new Date(dStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="report-header-wrapper" style={{ marginBottom: '24px' }}>
      {/* 1. Global Report Header */}
      <div className="report-global-header">
        <div>
          <div className="report-brand-title">Urban Furniture</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Accounting & Financial Reporting
          </div>
          <h1 className="report-main-title">{reportName}</h1>
          {subtitle && <p className="report-subtitle">{subtitle}</p>}
          <div className="report-period-badge">
            <span>📅 Reporting Period:</span>
            <strong>
              {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
            </strong>
          </div>
        </div>

        <div className="report-header-actions no-print">
          <button
            type="button"
            onClick={onPrint}
            className="btn-report-action btn-report-print"
            title="Print clean statement (hides navigation and sidebars)"
          >
            🖨️ Print
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={loading}
            className="btn-report-action btn-report-download"
            title="Export authoritative financial statement to PDF"
          >
            📥 Download PDF
          </button>
        </div>
      </div>

      {/* 2. Period Selector Bar */}
      <div className="period-selector-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            PERIOD:
          </span>
          <div className="period-pills">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'THIS_QUARTER', label: 'This Quarter' },
              { id: 'THIS_YEAR', label: 'This Year' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePillClick(p.id)}
                className={`period-pill ${activePill === p.id ? 'active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {activePill === 'CUSTOM' && (
          <div className="custom-range-inputs">
            <span>From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="custom-range-input"
            />
            <span>To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="custom-range-input"
            />
            <button
              type="button"
              onClick={handleCustomApply}
              className="btn btn-primary"
              style={{ height: '36px', padding: '0 14px', fontSize: '0.8rem' }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHeader;
