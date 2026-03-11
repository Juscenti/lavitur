import { useEffect, useState, useCallback } from 'react';
import {
  listTickets,
  getSupportTeam,
  getTicket,
  updateTicket,
  addMessage,
} from '../lib/support.js';
import '../styles/support.css';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function StatusPill({ status }) {
  const c = `support-pill support-pill--status support-pill--${status || 'open'}`;
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label || status || '—';
  return <span className={c}>{label}</span>;
}

function PriorityPill({ priority }) {
  const c = `support-pill support-pill--priority support-pill--priority-${priority || 'normal'}`;
  const label = PRIORITY_OPTIONS.find((o) => o.value === priority)?.label || priority || '—';
  return <span className={c}>{label}</span>;
}

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [team, setTeam] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [showInternalNotes, setShowInternalNotes] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingMeta, setUpdatingMeta] = useState(false);

  const loadTickets = useCallback(() => {
    setLoading(true);
    setError('');
    listTickets({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
      q: search.trim() || undefined,
    })
      .then(({ summary: s, tickets: t }) => {
        setSummary(s || null);
        setTickets(t || []);
      })
      .catch((err) => setError(err?.message || 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    getSupportTeam()
      .then((list) => setTeam(Array.isArray(list) ? list : []))
      .catch(() => setTeam([]));
  }, []);

  useEffect(() => {
    if (!detailTicketId) {
      setDetail(null);
      setDetailError('');
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    getTicket(detailTicketId)
      .then((data) => {
        setDetail({ ticket: data.ticket, messages: data.messages || [] });
      })
      .catch((err) => setDetailError(err?.message || 'Failed to load ticket'))
      .finally(() => setDetailLoading(false));
  }, [detailTicketId]);

  const openDetail = (ticket) => {
    setDetailTicketId(ticket.id);
    setReplyBody('');
    setReplyInternal(false);
  };

  const closeDetail = () => {
    setDetailTicketId(null);
    setDetail(null);
    loadTickets();
  };

  const refreshDetail = useCallback(() => {
    if (!detailTicketId) return;
    getTicket(detailTicketId)
      .then((data) => setDetail({ ticket: data.ticket, messages: data.messages || [] }))
      .catch(() => {});
  }, [detailTicketId]);

  const handleUpdateMeta = (field, value) => {
    if (!detail?.ticket) return;
    setUpdatingMeta(true);
    updateTicket(detail.ticket.id, { [field]: value })
      .then((updated) => setDetail((d) => (d ? { ...d, ticket: updated } : d)))
      .then(() => loadTickets())
      .catch(() => {})
      .finally(() => setUpdatingMeta(false));
  };

  const handleSendReply = () => {
    const body = replyBody?.trim();
    if (!body || !detail?.ticket) return;
    setSendingReply(true);
    addMessage(detail.ticket.id, { body, is_internal_note: replyInternal })
      .then(() => {
        setReplyBody('');
        setReplyInternal(false);
        refreshDetail();
      })
      .catch(() => {})
      .finally(() => setSendingReply(false));
  };

  const visibleMessages = detail?.messages?.filter((m) => showInternalNotes || !m.is_internal_note) ?? [];

  return (
    <section className="support-page panel">
      <header className="support-page-header content-page-header">
        <div className="content-page-header-text">
          <h1>Support Tickets</h1>
          <p className="content-page-subtitle content-page-subtitle--support">
            Track customer issues, order problems, and ambassador queries. Reply and assign from the ticket detail.
          </p>
        </div>
      </header>

      {summary && (
        <div className="support-summary-cards">
          <article className="support-summary-card">
            <span className="support-summary-label">Open</span>
            <span className="support-summary-value">{summary.open ?? '—'}</span>
          </article>
          <article className="support-summary-card">
            <span className="support-summary-label">Pending</span>
            <span className="support-summary-value">{summary.pending ?? '—'}</span>
          </article>
          <article className="support-summary-card">
            <span className="support-summary-label">Resolved</span>
            <span className="support-summary-value">{summary.resolved_7d ?? '—'}</span>
          </article>
          <article className="support-summary-card">
            <span className="support-summary-label">Closed</span>
            <span className="support-summary-value">{summary.closed ?? '—'}</span>
          </article>
        </div>
      )}

      <div className="content-page-filters support-page-filters">
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All</option>
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <input
            type="text"
            placeholder="Any"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="support-filter-category"
          />
        </label>
        <label>
          Search
          <input
            type="search"
            placeholder="Subject or ticket ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading && <p className="support-status">Loading tickets…</p>}
      {error && <p className="support-status support-status--error">{error}</p>}

      {!loading && !error && (
        <div className="support-table-card">
          <table className="support-table data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="support-table-empty">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="support-table-row"
                    onClick={() => openDetail(t)}
                  >
                    <td><strong className="support-subject-cell">{t.subject || '—'}</strong></td>
                    <td>{t.user_name || '—'}</td>
                    <td><code className="support-order-cell">{t.order_id || '—'}</code></td>
                    <td><StatusPill status={t.status} /></td>
                    <td><PriorityPill priority={t.priority} /></td>
                    <td>{t.assignee_name || 'Unassigned'}</td>
                    <td>{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                    <td className="support-table-actions">
                      <button
                        type="button"
                        className="btn btn-small support-btn-view"
                        onClick={(e) => { e.stopPropagation(); openDetail(t); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket detail slide-over */}
      {detailTicketId && (
        <div className="support-overlay" onClick={closeDetail} aria-hidden="true">
          <div
            className="support-detail-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="support-detail-title"
          >
            <header className="support-detail-header">
              <div className="support-detail-header-top">
                <h2 id="support-detail-title" className="support-detail-subject">
                  {detailLoading ? 'Loading…' : detail?.ticket?.subject || 'Ticket'}
                </h2>
                <button
                  type="button"
                  className="support-detail-close"
                  onClick={closeDetail}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {detailError && <p className="support-detail-error">{detailError}</p>}
              {detail?.ticket && (
                <div className="support-detail-meta">
                  <label className="support-detail-meta-label">
                    Status
                    <select
                      value={detail.ticket.status || ''}
                      onChange={(e) => handleUpdateMeta('status', e.target.value)}
                      disabled={updatingMeta}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="support-detail-meta-label">
                    Priority
                    <select
                      value={detail.ticket.priority || ''}
                      onChange={(e) => handleUpdateMeta('priority', e.target.value)}
                      disabled={updatingMeta}
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="support-detail-meta-label">
                    Assignee
                    <select
                      value={detail.ticket.assignee_profile_id || ''}
                      onChange={(e) => handleUpdateMeta('assignee_profile_id', e.target.value || null)}
                      disabled={updatingMeta}
                    >
                      <option value="">Unassigned</option>
                      {team.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="support-detail-meta-label">
                    Category
                    <input
                      type="text"
                      value={detail.ticket.category || ''}
                      onChange={(e) => handleUpdateMeta('category', e.target.value)}
                      disabled={updatingMeta}
                      placeholder="—"
                    />
                  </label>
                </div>
              )}
              {detail?.ticket && (
                <div className="support-detail-dates">
                  <span>Created: {detail.ticket.created_at ? new Date(detail.ticket.created_at).toLocaleString() : '—'}</span>
                  <span>Updated: {detail.ticket.updated_at ? new Date(detail.ticket.updated_at).toLocaleString() : '—'}</span>
                  {detail.ticket.closed_at && (
                    <span>Closed: {new Date(detail.ticket.closed_at).toLocaleString()}</span>
                  )}
                  {detail.ticket.user_name && <span>Customer: {detail.ticket.user_name}</span>}
                  {detail.ticket.order_id && <span>Order: <code>{detail.ticket.order_id}</code></span>}
                </div>
              )}
            </header>

            <div className="support-detail-thread">
              <div className="support-detail-thread-toolbar">
                <label className="support-internal-toggle">
                  <input
                    type="checkbox"
                    checked={showInternalNotes}
                    onChange={(e) => setShowInternalNotes(e.target.checked)}
                  />
                  Show internal notes
                </label>
              </div>
              <div className="support-messages">
                {detailLoading ? (
                  <p className="support-messages-loading">Loading messages…</p>
                ) : (
                  visibleMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`support-message support-message--${m.sender_type} ${m.is_internal_note ? 'support-message--internal' : ''}`}
                    >
                      <div className="support-message-meta">
                        <span className="support-message-sender">{m.sender_name || m.sender_type}</span>
                        {m.is_internal_note && <span className="support-message-internal-badge">Internal</span>}
                        <span className="support-message-time">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="support-message-body">{m.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {detail?.ticket && (
              <div className="support-detail-reply">
                <textarea
                  className="support-reply-textarea"
                  placeholder={replyInternal ? 'Internal note…' : 'Reply to customer…'}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={3}
                />
                <div className="support-reply-actions">
                  <label className="support-reply-internal">
                    <input
                      type="checkbox"
                      checked={replyInternal}
                      onChange={(e) => setReplyInternal(e.target.checked)}
                    />
                    Internal note
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary support-btn-reply"
                    onClick={handleSendReply}
                    disabled={!replyBody?.trim() || sendingReply}
                  >
                    {sendingReply ? 'Sending…' : replyInternal ? 'Add internal note' : 'Reply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
