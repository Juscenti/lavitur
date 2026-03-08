import { useState, useEffect } from 'react';
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

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const data = await api.get('/admin/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setOrders([]);
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

  return (
    <section className="panel">
      <h1>Orders</h1>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody id="ordersTbody">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5}>Loading orders…</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.status}</td>
                  <td>
                    {o.currency} {Number(o.total).toFixed(2)}
                  </td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      className="orderStatus"
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
