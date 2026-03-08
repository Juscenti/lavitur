import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const STATUS_OPTIONS = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

function formatMoney(currency, total) {
  const n = Number(total);
  if (Number.isNaN(n)) return '—';
  return `${currency || 'JMD'} ${n.toFixed(2)}`;
}

function field(value, fallback = '—') {
  return value != null && String(value).trim() !== '' ? String(value).trim() : fallback;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/admin/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const is404 = err.status === 404;
          const msg = err.data?.error || err.message || (is404 ? 'Order not found.' : 'Failed to load order.');
          setError(msg);
          setOrder(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orderId]);

  const handleStatusChange = async (status) => {
    if (!order) return;
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status });
      setOrder((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <p className="panel-muted">Loading order…</p>
      </section>
    );
  }
  if (error || !order) {
    return (
      <section className="panel">
        <p className="panel-muted" style={{ color: 'var(--danger, #c00)' }}>{error || 'Order not found.'}</p>
        <button type="button" className="order-detail-back" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
      </section>
    );
  }

  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const customerName = order.customer_name || order.shipping_name;
  const customerEmail = order.customer_email;
  const shipping = order.shipping && typeof order.shipping === 'object' ? order.shipping : null;

  return (
    <section className="panel order-detail-panel">
      <div className="order-detail-header">
        <button type="button" className="order-detail-back" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
        <h1>Order {order.id.slice(0, 8)}</h1>
        <div className="order-detail-meta">
          <span className={`order-status order-status--${order.status}`}>{order.status}</span>
          <span className="order-detail-created">{new Date(order.created_at).toLocaleString()}</span>
          <span className="order-detail-total">{formatMoney(order.currency, order.total)}</span>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="order-detail-block">
          <h2>Customer</h2>
          <dl>
            <dt>Name</dt>
            <dd>{field(customerName)}</dd>
            <dt>Email</dt>
            <dd>{field(customerEmail)}</dd>
            {(order.shipping_phone || shipping?.phone) && (
              <>
                <dt>Phone</dt>
                <dd>{field(order.shipping_phone || shipping?.phone)}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="order-detail-block">
          <h2>Shipping address</h2>
          <address className="order-detail-address">
            {field(order.shipping_name || shipping?.fullName)}<br />
            {field(order.shipping_address_line1 || shipping?.address)}<br />
            {order.shipping_address_line2 && <>{field(order.shipping_address_line2)}<br /></>}
            {[order.shipping_city, order.shipping_parish, order.shipping_postal].filter(Boolean).length > 0 && (
              <>
                {[order.shipping_city, order.shipping_parish].filter(Boolean).join(', ')}
                {order.shipping_postal && ` ${order.shipping_postal}`}
                <br />
              </>
            )}
            {field(order.shipping_country || shipping?.country)}
          </address>
        </div>

        <div className="order-detail-block order-detail-status-block">
          <h2>Status</h2>
          <select
            className="orderStatus"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {order.notes && (
        <div className="order-detail-block">
          <h2>Notes</h2>
          <p className="order-detail-notes">{order.notes}</p>
        </div>
      )}

      <div className="order-detail-block order-detail-items-block">
        <h2>Items ({items.length})</h2>
        <p className="order-detail-items-source">
          Line items are stored in the <code>order_items</code> table (one row per product in this order).
        </p>
        {items.length === 0 ? (
          <p className="panel-muted">No line items recorded for this order. It may have been created before items were stored, or via another flow.</p>
        ) : (
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.id}>
                    <td>{line.product_title || '—'}</td>
                    <td>{line.quantity}</td>
                    <td>{formatMoney(order.currency, line.unit_price)}</td>
                    <td>{formatMoney(order.currency, line.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
