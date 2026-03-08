import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
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

function shortId(uuid) {
  if (!uuid) return '—';
  return String(uuid).slice(0, 8);
}

function formatMoney(currency, total) {
  const n = Number(total);
  if (Number.isNaN(n)) return '—';
  return `${currency || 'JMD'} ${n.toFixed(2)}`;
}

function shippingLine(order) {
  const parts = [
    order.shipping_city,
    order.shipping_parish,
    order.shipping_country,
  ].filter(Boolean);
  if (parts.length) return parts.join(', ');
  const addr = order.shipping_address_line1;
  if (addr) return addr.length > 40 ? addr.slice(0, 37) + '…' : addr;
  return '—';
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/admin/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    }
  };

  const items = (order) => Array.isArray(order.order_items) ? order.order_items : [];
  const customerName = (o) => o.customer_name || o.shipping_name || '—';
  const customerEmail = (o) => o.customer_email || '—';

  return (
    <section className="panel">
      <h1>Orders</h1>
      {error && (
        <div className="orders-error" style={{ marginBottom: '1rem', color: 'var(--danger, #c00)' }}>
          {error}
          <button type="button" onClick={fetchOrders} style={{ marginLeft: '0.5rem' }}>Retry</button>
        </div>
      )}
      <div className="table-container">
        <table className="user-table orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Shipping</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading orders…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8}>No orders yet.</td>
              </tr>
            ) : (
              orders.map((o) => {
                const itemList = items(o);
                const isExpanded = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td>
                        <Link to={`/orders/${o.id}`} className="order-id-link" title={o.id}>
                          {shortId(o.id)}
                        </Link>
                        {' · '}
                        <Link to={`/orders/${o.id}`} className="order-view-link">View full order</Link>
                      </td>
                      <td>
                        <div className="order-customer">
                          <strong>{customerName(o)}</strong>
                          <small>{customerEmail(o)}</small>
                        </div>
                      </td>
                      <td className="order-shipping">{shippingLine(o)}</td>
                      <td>
                        <button
                          type="button"
                          className="order-items-toggle"
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                          title={itemList.length ? `${itemList.length} line item(s) from order_items table` : 'No line items recorded'}
                        >
                          {itemList.length} item{itemList.length !== 1 ? 's' : ''}
                        </button>
                      </td>
                      <td>{formatMoney(o.currency, o.total)}</td>
                      <td>
                        <span className={`order-status order-status--${o.status}`}>{o.status}</span>
                      </td>
                      <td>{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                      <td>
                        <select
                          className="orderStatus"
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {isExpanded && itemList.length > 0 && (
                      <tr key={`${o.id}-items`} className="order-detail-row">
                        <td colSpan={8}>
                          <div className="order-items-detail">
                            <table>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Qty</th>
                                  <th>Unit</th>
                                  <th>Line total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {itemList.map((line) => (
                                  <tr key={line.id}>
                                    <td>{line.product_title || '—'}</td>
                                    <td>{line.quantity}</td>
                                    <td>{formatMoney(o.currency, line.unit_price)}</td>
                                    <td>{formatMoney(o.currency, line.line_total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
