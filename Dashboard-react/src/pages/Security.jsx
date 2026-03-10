import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function formatNumber(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat().format(v);
}

function Status({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="security-loading">
        <div className="security-loading-spinner" aria-hidden />
        <p>Loading security overview…</p>
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

function truncate(str, max = 120) {
  if (!str) return '';
  const s = String(str);
  return s.length <= max ? s : s.slice(0, max) + '…';
}

export default function Security() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/admin/security/overview'),
      api.get('/admin/security/events'),
    ])
      .then(([o, e]) => {
        setOverview(o || null);
        setEvents(e?.events || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load security data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userDisplay = (ev) => {
    if (ev.user_email) return ev.user_email;
    if (ev.user_name) return ev.user_name;
    if (ev.user_id) return String(ev.user_id).slice(0, 8) + '…';
    return '—';
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Security</h1>
          <p className="panel-subtitle">
            Monitor login activity, locked accounts, and MFA adoption. Spot risky access patterns quickly.
          </p>
        </div>
      </header>

      <Status loading={loading} error={error} onRetry={fetchData} />

      {!loading && !error && (
        <>
          <div className="security-kpi-grid">
            <article className="security-kpi-card security-kpi-card--locked">
              <p className="kpi-label">Locked accounts</p>
              <p className="kpi-value">{formatNumber(overview?.locked_accounts ?? 0)}</p>
            </article>
            <article className="security-kpi-card security-kpi-card--failed">
              <p className="kpi-label">Failed logins (24h)</p>
              <p className="kpi-value">{formatNumber(overview?.failed_24h ?? 0)}</p>
            </article>
            <article className="security-kpi-card security-kpi-card--mfa">
              <p className="kpi-label">Staff with MFA</p>
              <p className="kpi-value">{formatNumber(overview?.staff_mfa_enabled ?? 0)}</p>
            </article>
          </div>

          <section className="security-section-card">
            <h2>Recent login events</h2>
            <p className="section-desc">
              Latest sign-in attempts. Success and failed attempts with IP, location, and device info.
            </p>
            <div className="table-wrapper">
              {events.length === 0 ? (
                <div className="security-empty">
                  No login events yet. Events will appear here as users sign in.
                </div>
              ) : (
                <table className="security-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Result</th>
                      <th>IP</th>
                      <th>Location</th>
                      <th>User agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {ev.created_at
                            ? new Date(ev.created_at).toLocaleString()
                            : '—'}
                        </td>
                        <td>{userDisplay(ev)}</td>
                        <td>
                          <span
                            className={`security-result-badge security-result-badge--${ev.success ? 'success' : 'failed'}`}
                          >
                            {ev.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--admin-mono, ui-monospace, monospace)', fontSize: '0.85em' }}>
                          {ev.ip_address || '—'}
                        </td>
                        <td>
                          {ev.geo_city || ev.geo_country
                            ? [ev.geo_city, ev.geo_country].filter(Boolean).join(', ')
                            : '—'}
                        </td>
                        <td>
                          <span className="security-user-agent" title={ev.user_agent || undefined}>
                            {truncate(ev.user_agent, 80) || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
