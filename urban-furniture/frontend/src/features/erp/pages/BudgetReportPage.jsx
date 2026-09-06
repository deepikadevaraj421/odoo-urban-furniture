import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import ReportHeader from '../components/ReportHeader';
import erpApi from '../../../services/erpApi';
import generateReportPdf from '../../../utils/pdfGenerator';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const BudgetReportPage = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBudgetReport = async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const res = await erpApi.getBudgetReport({
        startDate: start || startDate,
        endDate: end || endDate,
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate budget report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetReport(startDate, endDate);
  }, []);

  const handlePeriodChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    fetchBudgetReport(start, end);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!data) return;

    const summary = data.summary || {};
    const report = data.report || [];

    const kpiItems = [
      { label: 'Total Budgets', value: String(summary.totalBudgets || 0) },
      { label: 'Total Planned', value: formatCurrency(summary.totalPlanned || 0) },
      { label: 'Total Actual', value: formatCurrency(summary.totalActual || 0) },
      { label: 'Total Variance', value: formatCurrency(summary.totalVariance || 0) },
    ];

    const rows = report.map((r) => [
      r.name,
      r.period,
      r.analyticAccount,
      formatCurrency(r.plannedAmount),
      r.hasLinkedActuals ? formatCurrency(r.actualAmount) : '₹0 (No linked act.)',
      formatCurrency(r.variance),
      `${r.percentageUsed}%`,
      r.status,
    ]);

    generateReportPdf({
      reportTitle: 'Budget Planning & Variance Report',
      periodText: `${startDate || 'Beginning'} to ${endDate}`,
      kpiItems,
      tables: [
        {
          title: 'OPERATIONAL BUDGET ALLOCATIONS & UTILIZATION',
          headers: ['Budget Name', 'Period', 'Analytic Account', 'Planned', 'Actual', 'Variance', 'Util %', 'Status'],
          rows,
          columnStyles: {
            0: { cellWidth: 38 },
            1: { cellWidth: 16 },
            2: { cellWidth: 32 },
            3: { halign: 'right', cellWidth: 22 },
            4: { halign: 'right', cellWidth: 24 },
            5: { halign: 'right', cellWidth: 22 },
            6: { halign: 'right', cellWidth: 14 },
            7: { cellWidth: 20 },
          },
        },
      ],
      validationText: `Overall Portfolio Utilization: ${summary.overallUtilization || 0}% • Linked to Analytic Accounts Master`,
    });
  };

  const summary = data?.summary || {};
  const report = data?.report || [];
  const analytics = data?.analytics || {};

  // Donut SVG generator helper
  const renderDonutChart = (items, size = 180) => {
    const validItems = items.filter((it) => it.value > 0);
    const total = validItems.reduce((s, it) => s + it.value, 0);
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '30px 0' }}>
          No data recorded
        </div>
      );
    }

    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;
    const colors = ['#1a4731', '#94a3b8', '#f57c00', '#c0392b'];

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <svg width={size} height={size} viewBox="0 0 180 180">
          <g transform="rotate(-90 90 90)">
            {validItems.map((it, idx) => {
              const sliceRatio = it.value / total;
              const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset * circumference;
              accumulatedOffset += sliceRatio;

              return (
                <circle
                  key={it.name}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </g>
          <text x="90" y="86" textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontWeight="500">
            TOTAL
          </text>
          <text x="90" y="104" textAnchor="middle" fontSize="13" fill="var(--text-primary)" fontWeight="700">
            ₹{total > 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString()}
          </text>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' }}>
          {validItems.map((it, idx) => {
            const pct = Math.round((it.value / total) * 1000) / 10;
            return (
              <div key={it.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: colors[idx % colors.length],
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>{it.name}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(it.value)}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem' }}>({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OVER BUDGET':
        return <span className="badge badge-warning" style={{ background: '#ffebee', color: '#c62828' }}>OVER BUDGET</span>;
      case 'NEAR LIMIT':
        return <span className="badge badge-sales" style={{ background: '#fff3e0', color: '#e65100' }}>NEAR LIMIT</span>;
      default:
        return <span className="badge badge-active" style={{ background: '#e8f5e9', color: '#2e7d32' }}>ON TRACK</span>;
    }
  };

  return (
    <ErpLayout title="Budget Report" subtitle="Operational Budgets & Variance Analysis">
      {/* Global Report Header */}
      <ReportHeader
        reportName="Budget Report"
        subtitle="Compare planned amounts with actual financial activity"
        startDate={startDate}
        endDate={endDate}
        onPeriodChange={handlePeriodChange}
        onDownloadPdf={handleDownloadPdf}
        onPrint={handlePrint}
        loading={loading}
      />

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing budget variance and analytic dimensions...
        </div>
      ) : data ? (
        <>
          {/* Top 4 Summary KPI Cards */}
          <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
              <div className="kpi-icon-box blue">🎯</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Budgets</span>
                <span className="kpi-val" style={{ color: '#1e88e5' }}>{summary.totalBudgets || 0}</span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="kpi-icon-box gold">📋</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Planned</span>
                <span className="kpi-val" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(summary.totalPlanned || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
              <div className="kpi-icon-box amber">⚡</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Actual</span>
                <span className="kpi-val" style={{ color: '#f57c00' }}>
                  {formatCurrency(summary.totalActual || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
              <div className="kpi-icon-box green">📊</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Variance</span>
                <span className="kpi-val" style={{ color: (summary.totalVariance || 0) >= 0 ? '#2e7d32' : '#c0392b' }}>
                  {formatCurrency(summary.totalVariance || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Row */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Planned vs Actual Bar Chart */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                📊 Planned vs. Actual Comparison
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(analytics.barChart || []).map((b) => {
                  const maxAmount = Math.max(b.planned, b.actual, 1);
                  const plannedPct = Math.round((b.planned / maxAmount) * 100);
                  const actualPct = Math.round((b.actual / maxAmount) * 100);

                  return (
                    <div key={b.name} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Act: {formatCurrency(b.actual)} / Plan: {formatCurrency(b.planned)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${plannedPct}%`, height: '100%', background: 'var(--accent)' }} />
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${actualPct}%`, height: '100%', background: actualPct > 85 ? '#c0392b' : '#00897b' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '2px' }} /> Planned
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#00897b', borderRadius: '2px' }} /> Actual
                </span>
              </div>
            </div>

            {/* Budget Utilization Donut & Status Categorization */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                🎯 Budget Utilization & Health
              </h3>

              {renderDonutChart(analytics.utilizationDonut || [])}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>ON TRACK</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b5e20' }}>
                    {analytics.varianceCategories?.underBudget || 0}
                  </div>
                </div>

                <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#e65100', fontWeight: 600 }}>NEAR LIMIT</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e65100' }}>
                    {analytics.varianceCategories?.nearLimit || 0}
                  </div>
                </div>

                <div style={{ background: '#ffebee', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#c62828', fontWeight: 600 }}>OVER BUDGET</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c62828' }}>
                    {analytics.varianceCategories?.overBudget || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Table */}
          <div className="erp-card-table">
            <div className="erp-table-header">
              <h3>Budget Allocations & Variance Summary ({report.length})</h3>
            </div>
            <div className="erp-table-scroll">
              {report.length === 0 ? (
                <div className="empty-state" style={{ margin: '40px auto' }}>
                  <div className="empty-state-icon">🎯</div>
                  <h3>No budget activity linked to this period.</h3>
                  <p>Create or assign budgets under Master Data → Budgets.</p>
                </div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Budget Name</th>
                      <th style={{ width: '100px' }}>Period</th>
                      <th>Analytic Account</th>
                      <th>Responsible</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Planned Amount</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Actual Amount</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Variance</th>
                      <th style={{ textAlign: 'right', width: '100px' }}>Utilization %</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                        </td>
                        <td>
                          <span className="badge badge-admin">{b.period}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)' }}>{b.analyticAccount}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{b.responsible}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(b.plannedAmount)}
                        </td>
                        <td style={{ textAlign: 'right', color: b.hasLinkedActuals ? '#f57c00' : 'var(--text-muted)' }}>
                          {b.hasLinkedActuals ? (
                            formatCurrency(b.actualAmount)
                          ) : (
                            <span style={{ fontStyle: 'italic', fontSize: '0.78rem' }}>No linked actual transactions</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: b.variance >= 0 ? '#2e7d32' : '#c0392b' }}>
                          {formatCurrency(b.variance)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {b.percentageUsed}%
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getStatusBadge(b.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </ErpLayout>
  );
};

export default BudgetReportPage;


