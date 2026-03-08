import { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { api } from '../lib/api';

function formatCurrency(n, currency = 'JMD') {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

export default function Dashboard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [metrics, setMetrics] = useState({
    gross_revenue: 0,
    total_orders: '—',
    new_users: '—',
    open_tickets: '—',
  });

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((data) => {
        setMetrics({
          gross_revenue: data.gross_revenue,
          total_orders: data.total_orders ?? '—',
          new_users: data.new_users ?? '—',
          open_tickets: data.open_tickets ?? '—',
        });
      })
      .catch((e) => console.warn('Failed to load dashboard metrics:', e));
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Weekly Sales',
            data: [2100, 3100, 1800, 4500, 3500, 5000, 4300],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3B82F6',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <>
      <h1>Welcome, Admin</h1>

      <div className="cards-grid">
        <div className="card">
          <h2>Total Sales</h2>
          <p id="sales-total">{formatCurrency(metrics.gross_revenue, 'JMD')}</p>
        </div>
        <div className="card">
          <h2>Orders</h2>
          <p id="orders-today">{String(metrics.total_orders)}</p>
        </div>
        <div className="card">
          <h2>New Users</h2>
          <p id="new-users">{metrics.new_users}</p>
        </div>
        <div className="card">
          <h2>Open Tickets</h2>
          <p id="open-tickets">{metrics.open_tickets}</p>
        </div>
      </div>

      <div className="chart-section">
        <canvas ref={chartRef} id="salesChart" />
      </div>
    </>
  );
}
