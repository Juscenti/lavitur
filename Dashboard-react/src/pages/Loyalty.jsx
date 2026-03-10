import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function formatNumber(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat().format(v);
}

function Status({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="loyalty-loading">
        <div className="loyalty-loading-spinner" aria-hidden />
        <p>Loading loyalty data…</p>
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

function tierBadgeClass(name) {
  if (!name) return 'loyalty-tier-badge--default';
  const n = String(name).toLowerCase();
  if (n.includes('bronze')) return 'loyalty-tier-badge--bronze';
  if (n.includes('silver')) return 'loyalty-tier-badge--silver';
  if (n.includes('gold')) return 'loyalty-tier-badge--gold';
  if (n.includes('platinum')) return 'loyalty-tier-badge--platinum';
  return 'loyalty-tier-badge--default';
}

function TierBadge({ name }) {
  return (
    <span className={`loyalty-tier-badge ${tierBadgeClass(name)}`}>
      {name || '—'}
    </span>
  );
}

export default function Loyalty() {
  const [overview, setOverview] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/admin/loyalty/overview'),
      api.get('/admin/loyalty/tiers'),
    ])
      .then(([o, t]) => {
        setOverview(o || null);
        setTiers(t?.tiers || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load loyalty data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const breakdown = overview?.tiers || [];
  const totalMembers = Number(overview?.members ?? 0);
  const maxMembersInTier = breakdown.length
    ? Math.max(...breakdown.map((r) => Number(r.members ?? 0)), 1)
    : 1;

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Loyalty</h1>
          <p className="panel-subtitle">
            View loyalty balances, tier distribution, and program health. Members earn points and move up tiers based on min points.
          </p>
        </div>
      </header>

      <Status loading={loading} error={error} onRetry={fetchData} />

      {!loading && !error && (
        <>
          <div className="loyalty-kpi-grid">
            <article className="loyalty-kpi-card loyalty-kpi-card--members">
              <p className="kpi-label">Total members</p>
              <p className="kpi-value">{formatNumber(overview?.members ?? 0)}</p>
            </article>
            <article className="loyalty-kpi-card loyalty-kpi-card--points">
              <p className="kpi-label">Total points</p>
              <p className="kpi-value">{formatNumber(overview?.total_points ?? 0)}</p>
            </article>
            <article className="loyalty-kpi-card loyalty-kpi-card--avg">
              <p className="kpi-label">Avg. points per member</p>
              <p className="kpi-value">{formatNumber(overview?.avg_points ?? 0)}</p>
            </article>
          </div>

          {breakdown.length > 0 && totalMembers > 0 && (
            <div className="loyalty-program-health">
              {breakdown.map((row, i) => {
                const pct = totalMembers ? Math.round((Number(row.members ?? 0) / totalMembers) * 100) : 0;
                const colors = ['#10b981', '#3B82F6', '#8b5cf6', '#f59e0b'];
                const color = colors[i % colors.length];
                return (
                  <div key={row.id || row.name || i} className="loyalty-health-item">
                    <span className="health-dot" style={{ background: color }} aria-hidden />
                    <div>
                      <div className="health-label">{row.name || 'Tier'}</div>
                      <div className="health-value">
                        {formatNumber(row.members)} ({pct}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="panel-columns">
            <section className="loyalty-section-card">
              <h2>Members by tier</h2>
              <p className="section-desc">
                Distribution of members across loyalty tiers. Min points define the threshold to reach each tier.
              </p>
              <div className="table-wrapper">
                {breakdown.length === 0 ? (
                  <div className="loyalty-empty">
                    No tier data yet. Add loyalty tiers and members will appear here.
                  </div>
                ) : (
                  <table className="loyalty-table">
                    <thead>
                      <tr>
                        <th style={{ width: '3rem' }}>#</th>
                        <th>Tier</th>
                        <th className="num">Members</th>
                        <th>Share</th>
                        <th className="num">Min points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((row, i) => {
                        const members = Number(row.members ?? 0);
                        const pct = maxMembersInTier ? Math.round((members / maxMembersInTier) * 100) : 0;
                        return (
                          <tr key={row.id || row.name || i}>
                            <td>
                              <span className="tier-rank">{i + 1}</span>
                            </td>
                            <td>
                              <TierBadge name={row.name} />
                            </td>
                            <td className="num">{formatNumber(row.members)}</td>
                            <td>
                              <div className="loyalty-distribution-bar">
                                <div
                                  className="loyalty-distribution-bar-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, var(--admin-primary), var(--admin-accent))`,
                                  }}
                                />
                              </div>
                            </td>
                            <td className="num">{formatNumber(row.min_points)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="loyalty-section-card">
              <h2>Tier configuration</h2>
              <p className="section-desc">
                Tier definitions and benefits. Edit tiers in your backend or database; this view is for monitoring.
              </p>
              <div className="table-wrapper">
                {tiers.length === 0 ? (
                  <div className="loyalty-empty">
                    No tiers defined yet. Configure loyalty tiers in your backend to get started.
                  </div>
                ) : (
                  <table className="loyalty-table">
                    <thead>
                      <tr>
                        <th style={{ width: '3rem' }}>#</th>
                        <th>Name</th>
                        <th className="num">Min points</th>
                        <th>Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((tier, i) => (
                        <tr key={tier.id}>
                          <td>
                            <span className="tier-rank">{i + 1}</span>
                          </td>
                          <td>
                            <span className="tier-name">{tier.name}</span>
                          </td>
                          <td className="num">{formatNumber(tier.min_points)}</td>
                          <td style={{ maxWidth: '280px' }}>
                            {tier.benefits_summary || tier.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
