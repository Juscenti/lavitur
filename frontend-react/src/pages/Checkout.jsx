import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import '../styles/checkout.css';

function formatMoney(amount, currency = 'JMD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount ?? 0));
}

export default function Checkout() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: user?.email ?? '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    api.get('/me/cart')
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        try {
          const raw = localStorage.getItem('cart');
          const parsed = raw ? JSON.parse(raw) : [];
          setItems(Array.isArray(parsed) ? parsed : []);
        } catch {
          setItems([]);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: user.email }));
  }, [user?.email]);

  const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!form.fullName?.trim() || !form.email?.trim() || !form.address?.trim()) {
      setError('Please fill in name, email, and address.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/me/orders', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
        address: form.address.trim(),
        city: form.city?.trim() || undefined,
        postalCode: form.postalCode?.trim() || undefined,
      });
      setPlaced(true);
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Something went wrong. Please try again.';
      const message = err?.status === 404
        ? 'Checkout service not found (404). Make sure the backend is running and has the latest code with the POST /api/me/orders route.'
        : msg;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="checkout-page">
        <main className="checkout-container">
          <h1>Checkout</h1>
          <div className="checkout-empty">
            <p>Sign in to checkout.</p>
            <Link to="/login" className="checkout-btn">Sign in</Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <main className="checkout-container">
          <h1>Checkout</h1>
          <p className="checkout-loading">Loading…</p>
        </main>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="checkout-page">
        <main className="checkout-container checkout-success-wrap">
          <div className="checkout-success">
            <h1>Thank you</h1>
            <p className="checkout-success-lead">Your order has been received.</p>
            <p className="checkout-success-sub">We&apos;ll send a confirmation to your email shortly.</p>
            <Link to="/shop" className="checkout-btn">Continue shopping</Link>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <main className="checkout-container">
          <h1>Checkout</h1>
          <div className="checkout-empty">
            <p>Your cart is empty.</p>
            <Link to="/shop" className="checkout-btn">Shop now</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-hero">
        <div className="checkout-hero-inner">
          <h1>Checkout</h1>
          <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link to="/cart">Cart</Link>
            <span aria-hidden="true"> / </span>
            <span>Checkout</span>
          </nav>
        </div>
      </header>

      <main className="checkout-container has-hero">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="checkout-section">
            <h2>Delivery details</h2>
            <div className="checkout-fields">
              <div className="checkout-field">
                <label htmlFor="checkout-fullName">Full name *</label>
                <input
                  id="checkout-fullName"
                  name="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-email">Email *</label>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-phone">Phone</label>
                <input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 876 000 0000"
                />
              </div>
              <div className="checkout-field checkout-field-full">
                <label htmlFor="checkout-address">Address *</label>
                <input
                  id="checkout-address"
                  name="address"
                  type="text"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-city">City</label>
                <input
                  id="checkout-city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Kingston"
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-postalCode">Postal code</label>
                <input
                  id="checkout-postalCode"
                  name="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="JM12345"
                />
              </div>
            </div>
          </section>

          {error && <p className="checkout-error" role="alert">{error}</p>}

          <div className="checkout-actions">
            <Link to="/cart" className="checkout-back">← Back to cart</Link>
            <button type="submit" className="checkout-submit" disabled={submitting}>
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          <ul className="checkout-items">
            {items.map((item, idx) => (
              <li key={idx} className="checkout-item">
                <img
                  src={item.image || item.image_url || '/images/placeholder.jpg'}
                  alt={item.name || item.title || ''}
                />
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{item.name || item.title || 'Untitled'}</span>
                  <span className="checkout-item-qty">× {item.quantity || 1}</span>
                </div>
                <span className="checkout-item-price">
                  {formatMoney((Number(item.price) || 0) * (item.quantity || 1))}
                </span>
              </li>
            ))}
          </ul>
          <div className="checkout-total">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>
        </aside>
      </main>
    </div>
  );
}
