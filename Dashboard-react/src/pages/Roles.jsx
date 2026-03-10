import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';

function formatNumber(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat().format(v);
}

function Status({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="roles-loading">
        <div className="roles-loading-spinner" aria-hidden />
        <p>Loading roles & permissions…</p>
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

function roleBadgeClass(role) {
  if (!role) return 'roles-role-badge--default';
  const r = String(role).toLowerCase();
  if (r === 'admin') return 'roles-role-badge--admin';
  if (r === 'ambassador') return 'roles-role-badge--ambassador';
  if (r === 'staff') return 'roles-role-badge--staff';
  return 'roles-role-badge--default';
}

function RoleBadge({ role }) {
  return (
    <span className={`roles-role-badge ${roleBadgeClass(role)}`}>
      {role || '—'}
    </span>
  );
}

function PermCell({ perm }) {
  const parts = [];
  if (perm?.read) parts.push({ key: 'R', cls: 'roles-perm-pill--read' });
  if (perm?.write) parts.push({ key: 'W', cls: 'roles-perm-pill--write' });
  if (perm?.admin) parts.push({ key: 'A', cls: 'roles-perm-pill--admin' });
  if (parts.length === 0) return <span style={{ color: 'var(--admin-text-muted)' }}>—</span>;
  return (
    <span className="roles-perm-cell">
      {parts.map((p) => (
        <span key={p.key} className={`roles-perm-pill ${p.cls}`}>
          {p.key}
        </span>
      ))}
    </span>
  );
}

export default function Roles() {
  const [users, setUsers] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/admin/roles/users'),
      api.get('/admin/roles/matrix'),
    ])
      .then(([u, m]) => {
        setUsers(u?.users || []);
        setMatrix(m || null);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load roles and permissions.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const roles = matrix?.roles || [];
  const resources = matrix?.resources || [];

  const stats = useMemo(() => {
    const byRole = {};
    let mfaCount = 0;
    let lockedCount = 0;
    users.forEach((u) => {
      const r = u.role || 'unknown';
      byRole[r] = (byRole[r] || 0) + 1;
      if (u.mfa_enabled) mfaCount += 1;
      if (u.is_locked) lockedCount += 1;
    });
    return { total: users.length, byRole, mfaCount, lockedCount };
  }, [users]);

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="panel-subtitle">
            Staff and ambassadors in the system, plus the permission matrix per role and resource. Locked accounts and MFA status are shown below.
          </p>
        </div>
      </header>

      <Status loading={loading} error={error} onRetry={fetchData} />

      {!loading && !error && (
        <>
          <div className="roles-kpi-grid">
            <article className="roles-kpi-card">
              <p className="kpi-label">Staff & ambassadors</p>
              <p className="kpi-value">{formatNumber(stats.total)}</p>
            </article>
            <article className="roles-kpi-card">
              <p className="kpi-label">By role</p>
              <p className="kpi-value" style={{ fontSize: '1rem', lineHeight: 1.4 }}>
                {Object.entries(stats.byRole).length === 0
                  ? '—'
                  : Object.entries(stats.byRole)
                      .map(([r, n]) => `${formatNumber(n)} ${r}`)
                      .join(', ')}
              </p>
            </article>
            <article className="roles-kpi-card">
              <p className="kpi-label">MFA enabled</p>
              <p className="kpi-value">{formatNumber(stats.mfaCount)}</p>
            </article>
            <article className="roles-kpi-card">
              <p className="kpi-label">Locked accounts</p>
              <p className="kpi-value">{formatNumber(stats.lockedCount)}</p>
            </article>
          </div>

          <section className="roles-section-card">
            <h2>Staff & ambassadors</h2>
            <p className="section-desc">
              Users with a non-customer role. Role, lock status, and MFA are shown for each account.
            </p>
            <div className="table-wrapper">
              {users.length === 0 ? (
                <div className="roles-empty">
                  No staff or ambassadors found.
                </div>
              ) : (
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Locked</th>
                      <th>MFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                        <td style={{ color: 'var(--admin-text-muted)' }}>{u.email || '—'}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td>
                          <span className={`roles-status-pill ${u.is_locked ? 'roles-status-pill--locked' : 'roles-status-pill--no'}`}>
                            {u.is_locked ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          {u.mfa_enabled ? (
                            <span className="roles-status-pill roles-status-pill--mfa">Enabled</span>
                          ) : (
                            <span className="roles-status-pill roles-status-pill--no">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="roles-section-card">
            <h2>Role matrix</h2>
            <p className="section-desc">
              Read (R), Write (W), and Admin (A) permissions per role and resource. Edit in your backend or database.
            </p>
            <div className="table-wrapper">
              {resources.length === 0 ? (
                <div className="roles-empty">
                  No permissions defined yet.
                </div>
              ) : (
                <table className="roles-matrix-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      {roles.map((r) => (
                        <th key={r.role_key} title={r.description || undefined}>
                          {r.display_name || r.role_key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res) => (
                      <tr key={res.resource}>
                        <td>{res.resource}</td>
                        {roles.map((r) => (
                          <td key={r.role_key}>
                            <PermCell perm={res.permissions?.[r.role_key]} />
                          </td>
                        ))}
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
