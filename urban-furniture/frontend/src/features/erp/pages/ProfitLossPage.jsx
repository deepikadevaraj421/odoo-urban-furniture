import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import ReportHeader from '../components/ReportHeader';
import erpApi from '../../../services/erpApi';
import generateReportPdf from '../../../utils/pdfGenerator';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const ProfitLossPage = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfitLoss = async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const res = await erpApi.getProfitLoss({
        startDate: start || startDate,
        endDate: end || endDate,
      });
      setData(res.data.profitAndLoss);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate Profit & Loss.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss(startDate, endDate);
  }, []);

  const handlePeriodChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    fetchProfitLoss(start, end);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!data) return;

    const summary = data.summary || {};
    const statement = data.statement || {};

    const kpiItems = [
      { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue || 0) },
      { label: 'Cost of Goods', value: formatCurrency(summary.totalCost || 0) },
      { label: 'Operating Expenses', value: formatCurrency(summary.totalOperatingExpenses || 0) },
      { label: 'Net Profit', value: formatCurrency(summary.netProfit || 0) },
    ];

    const statementRows = [];

    // 1. REVENUE
    statementRows.push([{ content: 'REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (statement.revenue?.accounts || []).filter(a => a.amount > 0).forEach((a) => {
      statementRows.push([`${a.code} - ${a.name}`, formatCurrency(a.amount)]);
    });
    statementRows.push([
      { content: 'TOTAL REVENUE', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(statement.revenue?.total || 0), styles: { fontStyle: 'bold' } },
    ]);

    // 2. COST / PURCHASES
    statementRows.push([{ content: 'COST / PURCHASES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (statement.cost?.accounts || []).filter(a => a.amount > 0).forEach((a) => {
      statementRows.push([`${a.code} - ${a.name}`, formatCurrency(a.amount)]);
    });
    statementRows.push([
      { content: 'TOTAL COST', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(statement.cost?.total || 0), styles: { fontStyle: 'bold' } },
    ]);

    // GROSS PROFIT
    statementRows.push([
      { content: 'GROSS PROFIT', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [26, 71, 49] } },
      { content: formatCurrency(statement.grossProfit || 0), styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [26, 71, 49] } },
    ]);

    // 3. OPERATING EXPENSES
    statementRows.push([{ content: 'OPERATING EXPENSES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (statement.operatingExpenses?.accounts || []).filter(a => a.amount > 0).forEach((a) => {
      statementRows.push([`${a.code} - ${a.name}`, formatCurrency(a.amount)]);
    });
    statementRows.push([
      { content: 'TOTAL OPERATING EXPENSES', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(statement.operatingExpenses?.total || 0), styles: { fontStyle: 'bold' } },
    ]);

    // NET PROFIT / LOSS
    statementRows.push([
      { content: 'NET PROFIT / LOSS', styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
      { content: formatCurrency(statement.netProfit || 0), styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
    ]);

    generateReportPdf({
      reportTitle: 'Profit & Loss Statement',
      periodText: `${startDate || 'Beginning'} to ${endDate}`,
      kpiItems,
      tables: [
        {
          title: 'INCOME STATEMENT SUMMARY',
          headers: ['Financial Classification', 'Amount (INR)'],
          rows: statementRows,
          columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right', cellWidth: 50 } },
        },
      ],
      validationText: `Net Profit Margin: ${summary.netProfitMargin || 0}% • Stated in Indian Rupees (INR)`,
    });
  };

  const summary = data?.summary || {};
  const statement = data?.statement || {};
  const analytics = data?.analytics || {};

  // Donut SVG generator helper
  const renderDonutChart = (items, size = 180) => {
    const validItems = items.filter((it) => it.value > 0);
    const total = validItems.reduce((s, it) => s + it.value, 0);
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '30px 0' }}>
          No values recorded
        </div>
      );
    }

    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;
    const colors = ['#1a4731', '#e65100', '#c0392b', '#1e88e5'];

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

  return (
    <ErpLayout title="Profit & Loss" subtitle="Revenue, Expenses & Profitability Analysis">
      {/* Global Report Header */}
      <ReportHeader
        reportName="Profit & Loss"
        subtitle="Revenue, expenses and profitability for the selected period"
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
          Computing revenue and operational expenses...
        </div>
      ) : data ? (
        <>
          {/* Top 4 KPI Cards */}
          <div className="erp-kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }}>
              <div className="kpi-icon-box green">💰</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Revenue</span>
                <span className="kpi-val" style={{ color: '#2e7d32' }}>
                  {formatCurrency(summary.totalRevenue || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f57c00' }}>
              <div className="kpi-icon-box amber">📦</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Purchases / Cost</span>
                <span className="kpi-val" style={{ color: '#f57c00' }}>
                  {formatCurrency(summary.totalCost || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #d32f2f' }}>
              <div className="kpi-icon-box gold">📤</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Expenses</span>
                <span className="kpi-val" style={{ color: '#d32f2f' }}>
                  {formatCurrency(summary.totalExpenses || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="kpi-icon-box blue">📊</div>
              <div className="kpi-details">
                <span className="kpi-label">Net Operating Profit</span>
                <span className="kpi-val" style={{ color: summary.netProfit >= 0 ? 'var(--accent)' : '#c0392b' }}>
                  {formatCurrency(summary.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Row: Monthly Trend & Donut Distribution */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Monthly Trend / Chart */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  📈 Revenue vs. Expense Trend
                </h3>
                <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                  Margin: {summary.netProfitMargin || 0}%
                </span>
              </div>

              {analytics.hasTrendData && analytics.monthlyTrend?.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                    {analytics.monthlyTrend.map((m) => {
                      const maxVal = Math.max(m.revenue, m.expenses, 1);
                      const revPct = Math.round((m.revenue / maxVal) * 100);
                      const expPct = Math.round((m.expenses / maxVal) * 100);

                      return (
                        <div key={m.month} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{m.month}</strong>
                            <span style={{ color: m.netProfit >= 0 ? '#2e7d32' : '#c0392b', fontWeight: 600 }}>
                              Net: {formatCurrency(m.netProfit)}
                            </span>
                          </div>

                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>Revenue: {formatCurrency(m.revenue)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${revPct}%`, height: '100%', background: '#2e7d32' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>Expenses: {formatCurrency(m.expenses)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${expPct}%`, height: '100%', background: '#c0392b' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📉</span>
                  Insufficient historical data for multi-month trend analysis.
                </div>
              )}
            </div>

            {/* Income vs Expense Donut */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                🍩 Revenue vs. Expense Distribution
              </h3>
              {renderDonutChart(analytics.incomeVsExpenseDonut || [])}
            </div>
          </div>

          {/* Detailed Financial Statement */}
          <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
            <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                INCOME STATEMENT (PROFIT & LOSS)
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Stated in Indian Rupees (INR)
              </span>
            </div>

            <table className="statement-table">
              <thead>
                <tr>
                  <th>Financial Classification</th>
                  <th style={{ textAlign: 'right', width: '180px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. REVENUE */}
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td colSpan={2} style={{ fontWeight: 800, color: '#2e7d32', letterSpacing: '0.04em' }}>
                    1. REVENUE / SALES INCOME
                  </td>
                </tr>
                {(statement.revenue?.accounts || []).map((a) => (
                  <tr key={a.id}>
                    <td style={{ paddingLeft: '32px' }}>
                      <strong style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>{a.code}</strong>
                      {a.name}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.amount)}</td>
                  </tr>
                ))}
                <tr className="statement-subtotal-row">
                  <td>TOTAL REVENUE</td>
                  <td style={{ textAlign: 'right', color: '#2e7d32', fontWeight: 700 }}>
                    {formatCurrency(statement.revenue?.total || 0)}
                  </td>
                </tr>

                {/* 2. COST / PURCHASES */}
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td colSpan={2} style={{ fontWeight: 800, color: '#f57c00', letterSpacing: '0.04em' }}>
                    2. COST OF GOODS SOLD / PURCHASES
                  </td>
                </tr>
                {(statement.cost?.accounts || []).map((a) => (
                  <tr key={a.id}>
                    <td style={{ paddingLeft: '32px' }}>
                      <strong style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>{a.code}</strong>
                      {a.name}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.amount)}</td>
                  </tr>
                ))}
                <tr className="statement-subtotal-row">
                  <td>TOTAL COST OF GOODS</td>
                  <td style={{ textAlign: 'right', color: '#f57c00', fontWeight: 700 }}>
                    {formatCurrency(statement.cost?.total || 0)}
                  </td>
                </tr>

                {/* GROSS PROFIT */}
                <tr style={{ background: 'rgba(26, 71, 49, 0.04)', fontWeight: 800 }}>
                  <td style={{ fontSize: '0.95rem', color: 'var(--accent)' }}>GROSS OPERATING PROFIT</td>
                  <td style={{ textAlign: 'right', fontSize: '0.95rem', color: 'var(--accent)' }}>
                    {formatCurrency(statement.grossProfit || 0)}
                  </td>
                </tr>

                {/* 3. OPERATING EXPENSES */}
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td colSpan={2} style={{ fontWeight: 800, color: '#d32f2f', letterSpacing: '0.04em' }}>
                    3. OPERATING & ADMINISTRATIVE EXPENSES
                  </td>
                </tr>
                {(statement.operatingExpenses?.accounts || []).map((a) => (
                  <tr key={a.id}>
                    <td style={{ paddingLeft: '32px' }}>
                      <strong style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>{a.code}</strong>
                      {a.name}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.amount)}</td>
                  </tr>
                ))}
                <tr className="statement-subtotal-row">
                  <td>TOTAL OPERATING EXPENSES</td>
                  <td style={{ textAlign: 'right', color: '#d32f2f', fontWeight: 700 }}>
                    {formatCurrency(statement.operatingExpenses?.total || 0)}
                  </td>
                </tr>

                {/* NET PROFIT */}
                <tr className="statement-total-row">
                  <td style={{ fontSize: '1.05rem', fontWeight: 800 }}>NET PROFIT / (LOSS)</td>
                  <td style={{ textAlign: 'right', fontSize: '1.05rem', fontWeight: 800 }}>
                    {formatCurrency(statement.netProfit || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </ErpLayout>
  );
};

export default ProfitLossPage;


