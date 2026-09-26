import { useState, useEffect } from 'react';
import ErpLayout from '../../../components/layout/ErpLayout';
import ReportHeader from '../components/ReportHeader';
import erpApi from '../../../services/erpApi';
import generateReportPdf from '../../../utils/pdfGenerator';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const BalanceSheetPage = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalanceSheet = async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const res = await erpApi.getBalanceSheet({
        startDate: start || startDate,
        endDate: end || endDate,
      });
      setData(res.data.balanceSheet);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate Balance Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet(startDate, endDate);
  }, []);

  const handlePeriodChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    fetchBalanceSheet(start, end);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!data) return;

    const summary = data.summary || {};
    const ratios = data.ratios || {};
    const assets = data.assets || {};
    const liabEquity = data.liabilitiesAndEquity || {};

    const kpiItems = [
      { label: 'Total Assets', value: formatCurrency(summary.totalAssets || 0) },
      { label: 'Total Liabilities', value: formatCurrency(summary.totalLiabilities || 0) },
      { label: 'Total Equity', value: formatCurrency(summary.totalEquity || 0) },
      { label: 'Working Capital', value: formatCurrency(summary.workingCapital || 0) },
    ];

    const ratioItems = [
      { label: 'Current Ratio', value: ratios.currentRatio },
      { label: 'Quick Ratio', value: ratios.quickRatio },
      { label: 'Cash Ratio', value: ratios.cashRatio },
      { label: 'Debt-to-Equity', value: ratios.debtToEquityRatio },
    ];

    // Left side: Assets rows
    const assetRows = [];
    assetRows.push([{ content: 'CURRENT ASSETS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (assets.currentAssets?.accounts || []).forEach((a) => {
      assetRows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance), `${a.pctOfAssets}%`]);
    });
    assetRows.push([
      { content: 'Total Current Assets [A]', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(assets.currentAssets?.subtotal || 0), styles: { fontStyle: 'bold' } },
      { content: `${assets.currentAssets?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
    ]);

    if (assets.fixedAssets?.accounts?.length > 0) {
      assetRows.push([{ content: 'FIXED ASSETS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
      assets.fixedAssets.accounts.forEach((a) => {
        assetRows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance), `${a.pctOfAssets}%`]);
      });
      assetRows.push([
        { content: 'Total Fixed Assets', styles: { fontStyle: 'bold' } },
        { content: formatCurrency(assets.fixedAssets?.subtotal || 0), styles: { fontStyle: 'bold' } },
        { content: `${assets.fixedAssets?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
      ]);
    }

    assetRows.push([
      { content: 'TOTAL ASSETS [E]', styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
      { content: formatCurrency(assets.totalAssets || 0), styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
      { content: '100.0%', styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
    ]);

    // Right side: Liabilities & Equity rows
    const liabRows = [];
    liabRows.push([{ content: 'CURRENT LIABILITIES', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (liabEquity.currentLiabilities?.accounts || []).forEach((a) => {
      liabRows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance), `${a.pctOfAssets}%`]);
    });
    liabRows.push([
      { content: 'Total Current Liabilities [B]', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(liabEquity.currentLiabilities?.subtotal || 0), styles: { fontStyle: 'bold' } },
      { content: `${liabEquity.currentLiabilities?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
    ]);

    if (liabEquity.longTermLiabilities?.accounts?.length > 0) {
      liabRows.push([{ content: 'LONG-TERM LIABILITIES', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
      liabEquity.longTermLiabilities.accounts.forEach((a) => {
        liabRows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance), `${a.pctOfAssets}%`]);
      });
      liabRows.push([
        { content: 'Total Long-term Liabilities', styles: { fontStyle: 'bold' } },
        { content: formatCurrency(liabEquity.longTermLiabilities?.subtotal || 0), styles: { fontStyle: 'bold' } },
        { content: `${liabEquity.longTermLiabilities?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
      ]);
    }

    liabRows.push([
      { content: 'TOTAL LIABILITIES', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(liabEquity.totalLiabilities?.subtotal || 0), styles: { fontStyle: 'bold' } },
      { content: `${liabEquity.totalLiabilities?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
    ]);

    liabRows.push([{ content: 'OWNER EQUITY & RETAINED EARNINGS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    (liabEquity.equity?.accounts || []).forEach((a) => {
      liabRows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance), `${a.pctOfAssets}%`]);
    });
    if (liabEquity.equity?.currentPeriodProfit) {
      liabRows.push(['Current Period Net Profit', formatCurrency(liabEquity.equity.currentPeriodProfit), '—']);
    }
    liabRows.push([
      { content: 'TOTAL OWNER EQUITY [F]', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(liabEquity.equity?.subtotal || 0), styles: { fontStyle: 'bold' } },
      { content: `${liabEquity.equity?.pctOfAssets || 0}%`, styles: { fontStyle: 'bold' } },
    ]);

    liabRows.push([
      { content: 'TOTAL LIABILITIES + OWNER EQUITY', styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
      { content: formatCurrency(liabEquity.totalLiabilitiesAndEquity || 0), styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
      { content: '100.0%', styles: { fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [26, 71, 49] } },
    ]);

    generateReportPdf({
      reportTitle: 'Balance Sheet',
      periodText: `${startDate || 'Beginning'} to ${endDate}`,
      kpiItems,
      ratios: ratioItems,
      tables: [
        {
          title: 'ASSETS',
          headers: ['Account Classification', 'Amount (INR)', '% of Assets'],
          rows: assetRows,
          columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 45 }, 2: { halign: 'right', cellWidth: 35 } },
        },
        {
          title: "LIABILITIES & OWNERS' EQUITY",
          headers: ['Account Classification', 'Amount (INR)', '% of Assets'],
          rows: liabRows,
          columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 45 }, 2: { halign: 'right', cellWidth: 35 } },
        },
      ],
      validationText: data.validation?.statusText,
    });
  };

  const summary = data?.summary || {};
  const ratios = data?.ratios || {};
  const assets = data?.assets || {};
  const liabEquity = data?.liabilitiesAndEquity || {};
  const validation = data?.validation || {};
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
    const colors = ['#1a4731', '#1e88e5', '#f57c00', '#00897b', '#7c3aed', '#d32f2f'];

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
    <ErpLayout title="Balance Sheet" subtitle="Financial Position Statement (Assets, Liabilities & Equity)">
      {/* Global Report Header */}
      <ReportHeader
        reportName="Balance Sheet"
        subtitle="Financial position of Urban Furniture for the selected reporting period"
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
          Computing real-time ledger balance sheet...
        </div>
      ) : data ? (
        <>
          {/* Top 4 Compact Summary KPI Cards */}
          <div className="erp-kpi-grid" style={{ marginBottom: '20px' }}>
            <div className="erp-kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="kpi-icon-box green">💰</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Assets</span>
                <span className="kpi-val" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(summary.totalAssets || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #d32f2f' }}>
              <div className="kpi-icon-box amber">📤</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Liabilities</span>
                <span className="kpi-val" style={{ color: '#d32f2f' }}>
                  {formatCurrency(summary.totalLiabilities || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #1e88e5' }}>
              <div className="kpi-icon-box blue">🏛️</div>
              <div className="kpi-details">
                <span className="kpi-label">Total Owner Equity</span>
                <span className="kpi-val" style={{ color: '#1e88e5' }}>
                  {formatCurrency(summary.totalEquity || 0)}
                </span>
              </div>
            </div>

            <div className="erp-kpi-card" style={{ borderLeft: '4px solid #00897b' }}>
              <div className="kpi-icon-box gold">⚖️</div>
              <div className="kpi-details">
                <span className="kpi-label">Working Capital</span>
                <span className="kpi-val" style={{ color: summary.workingCapital >= 0 ? '#2e7d32' : '#c0392b' }}>
                  {formatCurrency(summary.workingCapital || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Ratios Row (inspired by reference image) */}
          <div
            className="card"
            style={{
              padding: '14px 20px',
              marginBottom: '24px',
              background: 'var(--bg-card)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Current Ratio [A/B]</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ratios.currentRatio}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Working Capital [A-B]</span>
              <strong style={{ fontSize: '1.1rem', color: ratios.workingCapital >= 0 ? '#2e7d32' : '#c0392b' }}>
                {formatCurrency(ratios.workingCapital)}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Quick Ratio</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ratios.quickRatio}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Cash Ratio</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ratios.cashRatio}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Debt-to-Equity Ratio</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ratios.debtToEquityRatio}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Debt Ratio</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ratios.debtRatio}</strong>
            </div>
          </div>

          {/* Balance Validation Check Banner */}
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: validation.isBalanced ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)',
              border: `1px solid ${validation.isBalanced ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)'}`,
              color: validation.isBalanced ? '#2e7d32' : '#c0392b',
              fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>{validation.isBalanced ? '✓' : '⚠'}</span>
              <span>{validation.statusText}</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Total Assets ({formatCurrency(summary.totalAssets)}) = Liabilities + Equity ({formatCurrency(liabEquity.totalLiabilitiesAndEquity)})
            </div>
          </div>

          {/* Two-Column Financial Statement Layout */}
          <div className="balance-sheet-grid">
            {/* ====================================================
                LEFT COLUMN: ASSETS
                ==================================================== */}
            <div className="bs-column-card">
              <div className="bs-column-header">
                <h3>ASSETS</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>% of Assets</span>
              </div>

              {/* Current Assets */}
              <div className="bs-section-title">
                <span>Current Assets</span>
                <span>{assets.currentAssets?.pctOfAssets || 0}%</span>
              </div>
              <table className="statement-table">
                <tbody>
                  {(assets.currentAssets?.accounts || []).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong style={{ color: 'var(--accent)', marginRight: '6px' }}>{a.code}</strong>
                        {a.name}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                      <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                    </tr>
                  ))}
                  <tr className="statement-subtotal-row">
                    <td>Total Current Assets [A]</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(assets.currentAssets?.subtotal || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{assets.currentAssets?.pctOfAssets || 0}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Fixed Assets */}
              {assets.fixedAssets?.accounts?.length > 0 && (
                <>
                  <div className="bs-section-title">
                    <span>Fixed Assets</span>
                    <span>{assets.fixedAssets?.pctOfAssets || 0}%</span>
                  </div>
                  <table className="statement-table">
                    <tbody>
                      {assets.fixedAssets.accounts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong style={{ color: 'var(--accent)', marginRight: '6px' }}>{a.code}</strong>
                            {a.name}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                          <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                        </tr>
                      ))}
                      <tr className="statement-subtotal-row">
                        <td>Total Fixed Assets</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(assets.fixedAssets?.subtotal || 0)}</td>
                        <td style={{ textAlign: 'right' }}>{assets.fixedAssets?.pctOfAssets || 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Other Assets */}
              {assets.otherAssets?.accounts?.length > 0 && (
                <>
                  <div className="bs-section-title">
                    <span>Other Assets</span>
                    <span>{assets.otherAssets?.pctOfAssets || 0}%</span>
                  </div>
                  <table className="statement-table">
                    <tbody>
                      {assets.otherAssets.accounts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong style={{ color: 'var(--accent)', marginRight: '6px' }}>{a.code}</strong>
                            {a.name}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                          <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                        </tr>
                      ))}
                      <tr className="statement-subtotal-row">
                        <td>Total Other Assets</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(assets.otherAssets?.subtotal || 0)}</td>
                        <td style={{ textAlign: 'right' }}>{assets.otherAssets?.pctOfAssets || 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Total Assets */}
              <table className="statement-table">
                <tbody>
                  <tr className="statement-total-row">
                    <td>TOTAL ASSETS [E]</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(assets.totalAssets || 0)}</td>
                    <td style={{ textAlign: 'right', width: '80px' }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ====================================================
                RIGHT COLUMN: LIABILITIES & EQUITY
                ==================================================== */}
            <div className="bs-column-card">
              <div className="bs-column-header">
                <h3>LIABILITIES & OWNERS' EQUITY</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>% of Assets</span>
              </div>

              {/* Current Liabilities */}
              <div className="bs-section-title">
                <span>Current Liabilities</span>
                <span>{liabEquity.currentLiabilities?.pctOfAssets || 0}%</span>
              </div>
              <table className="statement-table">
                <tbody>
                  {(liabEquity.currentLiabilities?.accounts || []).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong style={{ color: '#d32f2f', marginRight: '6px' }}>{a.code}</strong>
                        {a.name}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                      <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                    </tr>
                  ))}
                  <tr className="statement-subtotal-row">
                    <td>Total Current Liabilities [B]</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(liabEquity.currentLiabilities?.subtotal || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{liabEquity.currentLiabilities?.pctOfAssets || 0}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Long-term Liabilities */}
              {liabEquity.longTermLiabilities?.accounts?.length > 0 && (
                <>
                  <div className="bs-section-title">
                    <span>Long-term Liabilities</span>
                    <span>{liabEquity.longTermLiabilities?.pctOfAssets || 0}%</span>
                  </div>
                  <table className="statement-table">
                    <tbody>
                      {liabEquity.longTermLiabilities.accounts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong style={{ color: '#d32f2f', marginRight: '6px' }}>{a.code}</strong>
                            {a.name}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                          <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                        </tr>
                      ))}
                      <tr className="statement-subtotal-row">
                        <td>Total Long-term Liabilities</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(liabEquity.longTermLiabilities?.subtotal || 0)}</td>
                        <td style={{ textAlign: 'right' }}>{liabEquity.longTermLiabilities?.pctOfAssets || 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Total Liabilities Line */}
              <table className="statement-table">
                <tbody>
                  <tr className="statement-subtotal-row" style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td>TOTAL LIABILITIES</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(liabEquity.totalLiabilities?.subtotal || 0)}</td>
                    <td style={{ textAlign: 'right', width: '80px' }}>{liabEquity.totalLiabilities?.pctOfAssets || 0}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Owner Equity */}
              <div className="bs-section-title">
                <span>Owners' Equity</span>
                <span>{liabEquity.equity?.pctOfAssets || 0}%</span>
              </div>
              <table className="statement-table">
                <tbody>
                  {(liabEquity.equity?.accounts || []).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong style={{ color: '#1e88e5', marginRight: '6px' }}>{a.code}</strong>
                        {a.name}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
                      <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>{a.pctOfAssets}%</td>
                    </tr>
                  ))}
                  {liabEquity.equity?.currentPeriodProfit !== undefined && (
                    <tr>
                      <td style={{ fontStyle: 'italic', color: '#1a4731' }}>
                        Derived Current Period Net Profit (P&L)
                      </td>
                      <td style={{ textAlign: 'right', color: '#1a4731', fontWeight: 600 }}>
                        {formatCurrency(liabEquity.equity.currentPeriodProfit)}
                      </td>
                      <td style={{ textAlign: 'right', width: '80px', color: 'var(--text-muted)' }}>—</td>
                    </tr>
                  )}
                  <tr className="statement-subtotal-row">
                    <td>Total Owners' Equity [F]</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(liabEquity.equity?.subtotal || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{liabEquity.equity?.pctOfAssets || 0}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Liabilities + Equity */}
              <table className="statement-table">
                <tbody>
                  <tr className="statement-total-row">
                    <td>TOTAL LIABILITIES + OWNERS' EQUITY</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(liabEquity.totalLiabilitiesAndEquity || 0)}</td>
                    <td style={{ textAlign: 'right', width: '80px' }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Analytics Row (Donut / Composition Charts) */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Asset Composition Donut */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                📊 Asset Composition Breakdown
              </h3>
              {renderDonutChart(analytics.assetComposition || [])}
            </div>

            {/* Liabilities vs Equity Donut */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                ⚖️ Liabilities vs. Equity Distribution
              </h3>
              {renderDonutChart(analytics.liabilitiesVsEquity || [])}
            </div>
          </div>
        </>
      ) : null}
    </ErpLayout>
  );
};

export default BalanceSheetPage;


