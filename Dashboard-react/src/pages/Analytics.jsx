import { useEffect, useState, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { api } from '../lib/api';

const PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];

function formatCurrency(n, currency = 'JMD') {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${v.toFixed(0)}`;
  }
}

function formatNumber(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat().format(v);
}

function getDateRange(preset) {
  if (!preset || preset.days == null) return { from: '', to: '' };
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - preset.days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function Status({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="analytics-loading-spinner" aria-hidden />
        <p>Loading analytics…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return null;
}

export default function Analytics() {
  const [presetId, setPresetId] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[1];
  const { from, to } = getDateRange(preset);

  const fetchData = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api
      .get(`/admin/analytics/overview?${params.toString()}`)
      .then((d) => setData(d || null))
      .catch((err) => setError(err?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [from, to]);

  const kpis = data?.kpis || {};
  const daily = data?.daily || [];
  const topProducts = data?.topProducts || [];
  const topAmbassadors = data?.topAmbassadors || [];

  const maxProductRevenue = topProducts.length
    ? Math.max(...topProducts.map((p) => Number(p.revenue ?? 0)), 1)
    : 1;
  const maxAmbassadorRevenue = topAmbassadors.length
    ? Math.max(...topAmbassadors.map((a) => Number(a.gross_revenue ?? 0)), 1)
    : 1;

  // Revenue chart from daily data
  useEffect(() => {
    if (!chartRef.current || loading || error) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    const labels = daily.map((row) => {
      const d = new Date(row.day);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const revenueData = daily.map((row) => Number(row.revenue ?? 0));
    const ordersData = daily.map((row) => Number(row.orders ?? 0));
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue (JMD)',
            data: revenueData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Orders',
            data: ordersData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, padding: 16 },
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              callback(value) {
                return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;
              },
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [loading, error, daily]);

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Analytics</h1>
          <p className="panel-subtitle">
            Revenue, orders, and ambassador performance. Use the date range to focus on a specific period.
          </p>
        </div>
      </header>

      <Status loading={loading} error={error} onRetry={fetchData} />

      {!loading && !error && (
        <>
          <div className="analytics-toolbar">
            <span className="panel-subtitle" style={{ margin: 0 }}>
              Date range:
            </span>
            <div className="analytics-date-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-secondary ${presetId === p.id ? 'active' : ''}`}
                  onClick={() => setPresetId(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="analytics-kpi-grid">
            <article className="analytics-kpi-card analytics-kpi-card--revenue">
              <p className="kpi-label">Total revenue</p>
              <p className="kpi-value">
                {kpis.revenue != null ? formatCurrency(kpis.revenue) : '—'}
              </p>
            </article>
            <article className="analytics-kpi-card analytics-kpi-card--orders">
              <p className="kpi-label">Orders</p>
              <p className="kpi-value">
                {kpis.orders != null ? formatNumber(kpis.orders) : '—'}
              </p>
            </article>
            <article className="analytics-kpi-card analytics-kpi-card--aov">
              <p className="kpi-label">Avg. order value</p>
              <p className="kpi-value">
                {kpis.aov != null ? formatCurrency(kpis.aov) : '—'}
              </p>
            </article>
            <article className="analytics-kpi-card analytics-kpi-card--ambassador">
              <p className="kpi-label">Ambassador revenue</p>
              <p className="kpi-value">
                {kpis.ambassador_revenue != null
                  ? formatCurrency(kpis.ambassador_revenue)
                  : '—'}
              </p>
            </article>
          </div>

          <div className="analytics-chart-card">
            <h2>Daily performance</h2>
            <p className="chart-desc">
              Revenue and order count over time. Hover for exact values.
            </p>
            <div className={`chart-container ${daily.length === 0 ? 'chart-container--empty' : ''}`}>
              {daily.length === 0 ? (
                <div className="analytics-empty">
                  No daily data for this period. Orders will appear here once they exist in the selected range.
                </div>
              ) : (
                <canvas ref={chartRef} />
              )}
            </div>
          </div>

          <div className="panel-columns">
            <section className="analytics-section-card">
              <h2>Top products</h2>
              <p className="section-desc">By revenue in the selected period.</p>
              <div className="table-wrapper">
                {topProducts.length === 0 ? (
                  <div className="analytics-empty">No product sales yet.</div>
                ) : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th className="rank">#</th>
                        <th>Product</th>
                        <th className="num">Units</th>
                        <th>Share</th>
                        <th className="revenue-cell">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={p.product_id}>
                          <td className="rank">{i + 1}</td>
                          <td>{p.name || '—'}</td>
                          <td className="num">{formatNumber(p.units_sold)}</td>
                          <td>
                            <div className="analytics-progress-bar">
                              <div
                                className="analytics-progress-bar-fill"
                                style={{
                                  width: `${Math.round((Number(p.revenue ?? 0) / maxProductRevenue) * 100)}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="revenue-cell">
                            {formatCurrency(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="analytics-section-card">
              <h2>Top ambassadors</h2>
              <p className="section-desc">By gross revenue in the selected period.</p>
              <div className="table-wrapper">
                {topAmbassadors.length === 0 ? (
                  <div className="analytics-empty">No ambassador activity yet.</div>
                ) : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th className="rank">#</th>
                        <th>Ambassador</th>
                        <th className="num">Orders</th>
                        <th>Share</th>
                        <th className="revenue-cell">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAmbassadors.map((a, i) => (
                        <tr key={a.ambassador_profile_id || i}>
                          <td className="rank">{i + 1}</td>
                          <td>{a.name || a.ambassador_name || 'Unnamed'}</td>
                          <td className="num">
                            {formatNumber(a.orders ?? a.orders_count ?? 0)}
                          </td>
                          <td>
                            <div className="analytics-progress-bar">
                              <div
                                className="analytics-progress-bar-fill"
                                style={{
                                  width: `${Math.round(
                                    (Number(a.gross_revenue ?? 0) / maxAmbassadorRevenue) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="revenue-cell">
                            {formatCurrency(a.gross_revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {daily.length > 0 && (
            <section className="analytics-section-card" style={{ marginTop: '0.5rem' }}>
              <h2>Daily breakdown</h2>
              <p className="section-desc">Raw daily totals for reference.</p>
              <div className="table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th className="num">Orders</th>
                      <th className="revenue-cell">Revenue (JMD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...daily].reverse().map((row) => (
                      <tr key={row.day}>
                        <td>
                          {new Date(row.day).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="num">{formatNumber(row.orders)}</td>
                        <td className="revenue-cell">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
