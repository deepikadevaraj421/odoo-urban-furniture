import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ErpLayout from '../../../components/layout/ErpLayout';
import { ROUTES } from '../../../utils/constants';
import { PERMISSIONS } from '../../../utils/permissionConstants';
import { useAuth } from '../../../context/AuthContext';
import erpApi from '../../../services/erpApi';
import aboutFurnitureImg from '../../../assets/about_furniture.png';
import heroFurnitureImg from '../../../assets/hero_furniture.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];

const formatINR = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatINRCompact = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Status pill colours
const STATUS_COLORS = {
  PAID: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Paid' },
  Paid: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Paid' },
  UNPAID: { bg: 'rgba(230, 81, 0, 0.12)', color: '#e65100', label: 'Pending' },
  Pending: { bg: 'rgba(230, 81, 0, 0.12)', color: '#e65100', label: 'Pending' },
  PARTIALLY_PAID: { bg: 'rgba(2, 136, 209, 0.12)', color: '#0288d1', label: 'Partial' },
  Partial: { bg: 'rgba(2, 136, 209, 0.12)', color: '#0288d1', label: 'Partial' },
  DRAFT: { bg: 'rgba(123, 31, 162, 0.12)', color: '#7b1fa2', label: 'Draft' },
  Draft: { bg: 'rgba(123, 31, 162, 0.12)', color: '#7b1fa2', label: 'Draft' },
  CANCELLED: { bg: 'rgba(198, 40, 40, 0.12)', color: '#c62828', label: 'Cancelled' },
  CONFIRMED: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Confirmed' },
  Confirmed: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Confirmed' },
  INVOICED: { bg: 'rgba(21, 101, 192, 0.12)', color: '#1565c0', label: 'Invoiced' },
  RECEIVED: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Received' },
  Received: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', label: 'Received' },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_COLORS[status] || { bg: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)', label: status || '—' };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {cfg.label}
    </span>
  );
};

// ─── SVG Dual Bar Chart (Sales / Purchase Trend) ──────────────────────────────

const DualTrendChart = ({ data, hasData, primaryLabel = 'Sales', secondaryLabel = 'Payments' }) => {
  const W = 520, H = 190, padL = 54, padB = 36, padT = 20, padR = 16;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  if (!hasData || !data?.length) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 190,
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <span>No ledger transaction history found for the last 6 months.</span>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.sales || d.purchases || 0, d.payments || 0)), 1);
  const barW = Math.min(24, (chartW / data.length) * 0.34);
  const gap = chartW / data.length;

  const yTick = (v) => padT + chartH - (v / maxVal) * chartH;
  const yLabels = [0, 0.33, 0.66, 1].map((pct) => ({
    v: maxVal * pct,
    y: yTick(maxVal * pct),
  }));

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2d6a4f', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{primaryLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#52b788', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{secondaryLabel}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* Y grid lines */}
        {yLabels.map(({ v, y }) => (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontFamily="inherit">
              {v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
            </text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const cx = padL + i * gap + gap / 2;
          const primaryVal = d.sales !== undefined ? d.sales : (d.purchases || 0);
          const payVal = d.payments || 0;
          const primaryH = (primaryVal / maxVal) * chartH;
          const payH = (payVal / maxVal) * chartH;

          return (
            <g key={d.label}>
              {/* Primary Bar */}
              <rect
                x={cx - barW - 2}
                y={padT + chartH - primaryH}
                width={barW}
                height={primaryH || 2}
                rx="4"
                fill="#2d6a4f"
                opacity="0.9"
              >
                <title>{`${d.label}: ${primaryLabel} ${formatINRCompact(primaryVal)}`}</title>
              </rect>
              {/* Payments Bar */}
              <rect
                x={cx + 2}
                y={padT + chartH - payH}
                width={barW}
                height={payH || 2}
                rx="4"
                fill="#52b788"
                opacity="0.85"
              >
                <title>{`${d.label}: ${secondaryLabel} ${formatINRCompact(payVal)}`}</title>
              </rect>
              {/* Month label */}
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="500" fontFamily="inherit">
                {d.label.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── SVG Donut Chart ───────────────────────────────────────────────────────────

const DONUT_COLORS = ['#2d6a4f', '#e67e22', '#2980b9', '#8e44ad', '#7f8c8d'];

const DonutChart = ({ data, totalLabel = 'Total' }) => {
  if (!data?.length || data.every((d) => d.value === 0)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 180,
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        No status records logged yet.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 64, r = 42, cx = 85, cy = 85;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const angle = total > 0 ? (d.value / total) * 2 * Math.PI : 0;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const xi1 = cx + r * Math.cos(cumAngle - angle);
    const yi1 = cy + r * Math.sin(cumAngle - angle);
    const xi2 = cx + r * Math.cos(cumAngle);
    const yi2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path =
      total === d.value
        ? `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.001} ${cy - R} L ${cx - 0.001} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`
        : `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;

    return { path, color: DONUT_COLORS[i % DONUT_COLORS.length], ...d };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="170" height="170" viewBox="0 0 170 170" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity="0.92">
            <title>{`${s.name}: ${s.value} (${total > 0 ? Math.round((s.value / total) * 100) : 0}%)`}</title>
          </path>
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontWeight="600">
          {totalLabel}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="18" fill="var(--text-primary)" fontWeight="800">
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{d.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AccountantDashboard = ({ type = 'SALES' }) => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const isSales = type === 'SALES';

  // Date and Calendar state
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth()); // 0-indexed

  // API Data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateLoading, setDateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Month string format "YYYY-MM"
  const currentMonthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  // Fetch Dashboard Stats
  const fetchDashboard = useCallback(
    async (dateParam = selectedDate, isDateOnly = false) => {
      if (isDateOnly) setDateLoading(true);
      else setLoading(true);
      setError(null);

      try {
        const params = {
          month: `${calYear}-${String(calMonth + 1).padStart(2, '0')}`,
          date: dateParam,
        };
        const res = isSales
          ? await erpApi.getSalesDashboard(params)
          : await erpApi.getPurchaseDashboard(params);

        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load accountant dashboard:', err);
        setError('Failed to fetch real-time accounting records. Please refresh.');
      } finally {
        setLoading(false);
        setDateLoading(false);
      }
    },
    [calYear, calMonth, selectedDate, isSales]
  );

  useEffect(() => {
    fetchDashboard(selectedDate, false);
  }, [calYear, calMonth, isSales]);

  // Handle Date Click
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    fetchDashboard(dateStr, true);
  };

  // Month Navigation
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    handleDateClick(todayISO());
  };

  // Build Calendar Matrix
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = calMonth === 0 ? 12 : calMonth;
      const prevY = calMonth === 0 ? calYear - 1 : calYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({ dayNum, dateStr, currentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr, currentMonth: true });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = calMonth === 11 ? 1 : calMonth + 2;
      const nextY = calMonth === 11 ? calYear + 1 : calYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr, currentMonth: false });
    }

    return cells;
  }, [calYear, calMonth]);

  // Data mappings
  const kpi = data?.kpi || (isSales
    ? { totalSales: 0, pendingInvoices: 0, receivables: 0, paymentsReceived: 0 }
    : { totalPurchases: 0, pendingBills: 0, payables: 0, paymentsMade: 0 });

  const statusBreakdown = isSales ? data?.invoiceStatusBreakdown : data?.billStatusBreakdown;
  const trendData = isSales ? data?.salesTrend : data?.purchaseTrend;
  const activityDates = new Set(data?.activityDates || []);
  const dateActivities = data?.dateActivity?.activities || [];

  return (
    <ErpLayout
      title={isSales ? 'Sales & AR Portal' : 'Purchase & AP Portal'}
      subtitle={isSales ? 'Customer Accounts, Orders, Invoicing & Receivables' : 'Supplier Accounts, Orders, Vendor Bills & Payables'}
    >
      {/* ─── 1. Welcome Hero ────────────────────────────────────────── */}
      {!isSales && data?.pendingApprovalOrders?.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          <strong>Purchase orders awaiting Admin approval:</strong>{' '}
          {data.pendingApprovalOrders.map((order) => order.orderNumber).join(', ')}
        </div>
      )}
      {!isSales && data?.confirmedOrders?.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <strong>Purchase order confirmed:</strong>{' '}
          {data.confirmedOrders.map((order) => `${order.orderNumber} is ready for goods receipt`).join(', ')}
        </div>
      )}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface, #ffffff) 0%, rgba(45, 106, 79, 0.04) 100%)',
          borderRadius: '18px',
          border: '1px solid var(--border, rgba(0,0,0,0.08))',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="welcome-hero-card"
      >
        {/* Left Welcome Info */}
        <div style={{ flex: '1', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: isSales ? 'rgba(45, 106, 79, 0.12)' : 'rgba(230, 126, 34, 0.14)',
                color: isSales ? '#2d6a4f' : '#b85c14',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              {isSales ? 'SALES ACCOUNTANT WORKSPACE' : 'PURCHASE ACCOUNTANT WORKSPACE'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              • Code: {user?.accountantCode || 'ACC-00001'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {getGreeting()}, {user?.name || 'Accountant'}!
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: '520px', lineHeight: 1.5 }}>
            {isSales
              ? "Here's your accounting overview for today. Monitor customer balances, real-time invoicing, and receipts."
              : "Here's your procurement & accounts payable overview for today. Track supplier orders, vendor bills, and disbursements."}
          </p>

          {/* Interactive Date Selector Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              id="hero-date-selector-btn"
              onClick={() => {
                const el = document.getElementById('date-explorer-calendar');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border, rgba(0,0,0,0.12))',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
              }}
            >
              <span>📅</span>
              <span>{formatDate(selectedDate)}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>▼</span>
            </button>

            <button
              type="button"
              onClick={goToday}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, rgba(0,0,0,0.1))',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--accent)',
                cursor: 'pointer',
              }}
            >
              Go to Today
            </button>

            {loading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ⚡ Synchronizing ledger...
              </span>
            )}
          </div>
        </div>

        {/* Right Subtle Furniture Visual */}
        <div
          style={{
            position: 'relative',
            width: '240px',
            height: '140px',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.8)',
          }}
          className="hero-furniture-preview"
        >
          <img
            src={aboutFurnitureImg}
            alt="Urban Furniture Workspace"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              padding: '8px 12px',
              color: '#ffffff',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
              Urban Furniture Studio
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. 4 KPI Cards (Compact, Real Database Values) ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '26px',
        }}
      >
        {isSales ? (
          <>
            {/* KPI 1: Total Sales */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Total Sales</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(45, 106, 79, 0.12)', color: '#2d6a4f' }}>
                  📈
                </span>
              </div>
              <div style={kpiValStyle}>{formatINR(kpi.totalSales)}</div>
              <span style={kpiSubStyle}>All registered customer invoices</span>
            </div>

            {/* KPI 2: Pending Invoices */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Pending Invoices</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(230, 126, 34, 0.14)', color: '#b85c14' }}>
                  ⏳
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#e67e22' }}>{kpi.pendingInvoices}</div>
              <span style={kpiSubStyle}>Unpaid & partially paid invoices</span>
            </div>

            {/* KPI 3: Receivables */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Receivables</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(2, 136, 209, 0.12)', color: '#0288d1' }}>
                  💰
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#0288d1' }}>{formatINR(kpi.receivables)}</div>
              <span style={kpiSubStyle}>Outstanding customer balance due</span>
            </div>

            {/* KPI 4: Payments Received */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Payments Received</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32' }}>
                  💳
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#2e7d32' }}>{formatINR(kpi.paymentsReceived)}</div>
              <span style={kpiSubStyle}>Total customer collections received</span>
            </div>
          </>
        ) : (
          <>
            {/* KPI 1: Total Purchases */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Total Purchases</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(45, 106, 79, 0.12)', color: '#2d6a4f' }}>
                  📦
                </span>
              </div>
              <div style={kpiValStyle}>{formatINR(kpi.totalPurchases)}</div>
              <span style={kpiSubStyle}>All registered supplier bills</span>
            </div>

            {/* KPI 2: Pending Bills */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Pending Bills</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(230, 126, 34, 0.14)', color: '#b85c14' }}>
                  ⏳
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#e67e22' }}>{kpi.pendingBills}</div>
              <span style={kpiSubStyle}>Unsettled supplier bills</span>
            </div>

            {/* KPI 3: Payables */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Payables</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(123, 31, 162, 0.12)', color: '#7b1fa2' }}>
                  📑
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#7b1fa2' }}>{formatINR(kpi.payables)}</div>
              <span style={kpiSubStyle}>Outstanding vendor liability</span>
            </div>

            {/* KPI 4: Payments Made */}
            <div className="erp-kpi-card-v2" style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={kpiLabelStyle}>Payments Made</span>
                <span style={{ ...kpiIconBoxStyle, background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32' }}>
                  💳
                </span>
              </div>
              <div style={{ ...kpiValStyle, color: '#2e7d32' }}>{formatINR(kpi.paymentsMade)}</div>
              <span style={kpiSubStyle}>Disbursements released to vendors</span>
            </div>
          </>
        )}
      </div>

      {/* ─── 3. Main 2-Column Section: (Left Analytics + Table, Right Date Explorer) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
          marginBottom: '28px',
        }}
        className="dashboard-main-grid"
      >
        {/* LEFT COLUMN: Charts, Quick Actions, Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Main Analytics: 2 Sub-Columns (Trend + Donut) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
              gap: '18px',
            }}
            className="analytics-charts-grid"
          >
            {/* Chart 1: Trend */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border, rgba(0,0,0,0.08))',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  {isSales ? 'Sales Trend' : 'Purchase Trend'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Last 6 months comparison (Ledger vs. Payments)
                </p>
              </div>
              <DualTrendChart
                data={trendData}
                hasData={data?.hasTrendData}
                primaryLabel={isSales ? 'Sales' : 'Purchases'}
                secondaryLabel={isSales ? 'Receipts' : 'Disbursements'}
              />
            </div>

            {/* Chart 2: Status Donut */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border, rgba(0,0,0,0.08))',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  {isSales ? 'Invoice Status' : 'Bill Status'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Distribution of current ledger status
                </p>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DonutChart data={statusBreakdown} totalLabel={isSales ? 'Invoices' : 'Bills'} />
              </div>
            </div>
          </div>

          {/* Quick Actions (Permission-Aware) */}
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, rgba(0,0,0,0.08))',
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                ⚡ Quick Operations
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Restricted to your assigned permissions
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isSales ? (
                <>
                  {hasPermission(PERMISSIONS.CREATE_SALES_ORDERS) && (
                    <button
                      type="button"
                      id="qa-new-sales-order"
                      onClick={() => navigate(ROUTES.SALES_ORDERS)}
                      className="btn btn-primary"
                      style={quickBtnPrimary}
                    >
                      🛍️ New Sales Order
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.CREATE_CUSTOMER_INVOICES) && (
                    <button
                      type="button"
                      id="qa-create-customer-invoice"
                      onClick={() => navigate(ROUTES.CUSTOMER_INVOICES_MGMT)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      🧾 Create Customer Invoice
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.RECORD_CUSTOMER_PAYMENTS) && (
                    <button
                      type="button"
                      id="qa-record-customer-payment"
                      onClick={() => navigate(ROUTES.PAYMENTS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      💳 Record Customer Payment
                    </button>
                  )}
                  {(hasPermission(PERMISSIONS.VIEW_CUSTOMERS) || hasPermission(PERMISSIONS.MANAGE_CUSTOMERS)) && (
                    <button
                      type="button"
                      id="qa-view-customers"
                      onClick={() => navigate(ROUTES.CUSTOMER_MANAGEMENT)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      👥 View Customers
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                    <button
                      type="button"
                      id="qa-view-products"
                      onClick={() => navigate(ROUTES.PRODUCTS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      🛋️ View Products
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
                    <button
                      type="button"
                      id="qa-view-reports"
                      onClick={() => navigate(ROUTES.PROFIT_LOSS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      📊 Profit & Loss
                    </button>
                  )}
                </>
              ) : (
                <>
                  {hasPermission(PERMISSIONS.CREATE_PURCHASE_ORDERS) && (
                    <button
                      type="button"
                      id="qa-new-purchase-order"
                      onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
                      className="btn btn-primary"
                      style={quickBtnPrimary}
                    >
                      📦 New Purchase Order
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.RECEIVE_GOODS) && (
                    <button
                      type="button"
                      id="qa-receive-goods"
                      onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      📥 Receive Goods
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.CREATE_VENDOR_BILLS) && (
                    <button
                      type="button"
                      id="qa-create-vendor-bill"
                      onClick={() => navigate(ROUTES.VENDOR_BILLS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      📑 Create Vendor Bill
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.RECORD_VENDOR_PAYMENTS) && (
                    <button
                      type="button"
                      id="qa-record-vendor-payment"
                      onClick={() => navigate(ROUTES.PAYMENTS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      💳 Record Vendor Payment
                    </button>
                  )}
                  {(hasPermission(PERMISSIONS.VIEW_VENDORS) || hasPermission(PERMISSIONS.MANAGE_VENDORS)) && (
                    <button
                      type="button"
                      id="qa-view-vendors"
                      onClick={() => navigate(`${ROUTES.CONTACTS}?type=VENDOR`)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      🚚 View Vendors
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                    <button
                      type="button"
                      id="qa-view-products"
                      onClick={() => navigate(ROUTES.PRODUCTS)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      🛋️ View Products
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
                    <button
                      type="button"
                      id="qa-view-reports"
                      onClick={() => navigate(ROUTES.BUDGET_REPORT)}
                      className="btn btn-secondary"
                      style={quickBtnSecondary}
                    >
                      📉 Budget Report
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, rgba(0,0,0,0.08))',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border, rgba(0,0,0,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
                  Recent Transactions
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Real transaction ledger from PostgreSQL
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(isSales ? ROUTES.CUSTOMER_INVOICES_MGMT : ROUTES.VENDOR_BILLS)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View All Ledger →
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {data?.recentTransactions?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input, #faf9f6)', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Reference</th>
                      <th style={thStyle}>{isSales ? 'Customer' : 'Vendor'}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr
                        key={`${tx.type}-${tx.id}`}
                        style={{
                          borderBottom: '1px solid var(--border, rgba(0,0,0,0.04))',
                          transition: 'background-color 0.15s',
                        }}
                        className="table-row-hover"
                      >
                        <td style={tdStyle}>{formatDate(tx.date)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.type}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                            {tx.reference}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.party || '—'}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatINR(tx.amount)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <StatusPill status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transactions registered in this period.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Date Explorer Calendar & Selected Date Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Calendar Box */}
          <div
            id="date-explorer-calendar"
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, rgba(0,0,0,0.08))',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Calendar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Click a date to view activities
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  style={calNavBtnStyle}
                  title="Previous month"
                  aria-label="Previous month"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  style={{
                    background: 'var(--bg-input, #f5f5f5)',
                    border: '1px solid var(--border, rgba(0,0,0,0.08))',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={calNavBtnStyle}
                  title="Next month"
                  aria-label="Next month"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Weekday Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {DAY_NAMES.map((d) => (
                <span key={d} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarGrid.map((c, i) => {
                const isSelected = c.dateStr === selectedDate;
                const isTodayDate = c.dateStr === today;
                const hasActivity = activityDates.has(c.dateStr);

                return (
                  <button
                    key={`${c.dateStr}-${i}`}
                    type="button"
                    onClick={() => handleDateClick(c.dateStr)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid #2d6a4f'
                        : isTodayDate
                        ? '1px dashed #2d6a4f'
                        : '1px solid transparent',
                      background: isSelected
                        ? 'rgba(45, 106, 79, 0.12)'
                        : 'transparent',
                      color: !c.currentMonth
                        ? 'rgba(0,0,0,0.25)'
                        : isSelected
                        ? '#2d6a4f'
                        : 'var(--text-primary)',
                      fontWeight: isSelected || isTodayDate ? 800 : 500,
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s',
                    }}
                    title={`${c.dateStr}${hasActivity ? ' (Activity present)' : ''}`}
                  >
                    <span>{c.dayNum}</span>
                    {/* Activity Dot */}
                    {hasActivity && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: isSelected ? '#2d6a4f' : '#52b788',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Activity Section */}
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, rgba(0,0,0,0.08))',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.06))', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-primary)' }}>
                  Activities on {formatDate(selectedDate)}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {dateActivities.length} recorded transaction{dateActivities.length === 1 ? '' : 's'}
                </span>
              </div>
              {dateLoading && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Filtering...
                </span>
              )}
            </div>

            {/* Activities List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {dateActivities.length > 0 ? (
                dateActivities.map((act) => (
                  <div
                    key={`${act.type}-${act.id}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-input, #faf9f6)',
                      border: '1px solid var(--border, rgba(0,0,0,0.06))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {act.time}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {act.type}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {act.reference} • {act.party}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatINR(act.amount)}
                      </span>
                      <StatusPill status={act.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.84rem',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>🍃</span>
                  No activity recorded for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Bottom Furniture Brand Banner ───────────────────────── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          minHeight: '160px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)',
          marginTop: '12px',
        }}
      >
        <img
          src={heroFurnitureImg}
          alt="Urban Furniture Showcase"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.38)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '28px 36px',
            color: '#ffffff',
            maxWidth: '680px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '3px 10px',
                borderRadius: '20px',
              }}
            >
              CRAFTSMANSHIP & CLARITY
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Furniture for a Better Tomorrow
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Accurate accounting creates room for better business decisions. Seamless operations from raw timber procurement to finished living spaces.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={pillBadgeStyle}>Sustainable Teak & Oak</span>
            <span style={pillBadgeStyle}>Commercial Grade Standard</span>
            <span style={pillBadgeStyle}>Integrated Financial Ledger</span>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
};

// ─── Inline Styles ─────────────────────────────────────────────────────────────

const kpiCardStyle = {
  background: 'var(--bg-card, #ffffff)',
  borderRadius: '16px',
  border: '1px solid var(--border, rgba(0,0,0,0.08))',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const kpiLabelStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const kpiValStyle = {
  fontSize: '1.55rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '-0.03em',
  marginTop: '4px',
};

const kpiSubStyle = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  marginTop: '2px',
};

const kpiIconBoxStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9rem',
};

const quickBtnPrimary = {
  padding: '9px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  borderRadius: '10px',
};

const quickBtnSecondary = {
  padding: '9px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  borderRadius: '10px',
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--border, rgba(0,0,0,0.12))',
  color: 'var(--text-primary)',
};

const thStyle = {
  padding: '10px 16px',
  fontSize: '0.74rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '12px 16px',
  color: 'var(--text-primary)',
};

const calNavBtnStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  border: '1px solid var(--border, rgba(0,0,0,0.08))',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
};

const pillBadgeStyle = {
  fontSize: '0.72rem',
  fontWeight: 600,
  background: 'rgba(255,255,255,0.14)',
  backdropFilter: 'blur(6px)',
  padding: '4px 12px',
  borderRadius: '20px',
  color: '#ffffff',
};

export default AccountantDashboard;
