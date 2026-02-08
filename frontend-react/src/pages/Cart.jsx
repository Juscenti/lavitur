import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const remove = (id) => {
    const next = items.filter((i) => String(i.id) !== String(id));
    setItems(next);
    localStorage.setItem('cart', JSON.stringify(next));
  };

  const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0);

  return (
    <div className="page-section">
      <h1 className="section-title">Your Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. <Link to="/shop">Browse the shop</Link>.</p>
      ) : (
        <>
          <div className="cart-grid">
            {items.map((i) => (
              <div key={i.id} className="cart-item">
                <img src={i.image_url || '/images/placeholder.jpg'} alt={i.title} />
                <div className="cart-details">
                  <h3>{i.title}</h3>
                  <p>JMD {Number(i.price).toFixed(2)} × {i.quantity || 1}</p>
                  <button type="button" className="remove-btn" onClick={() => remove(i.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <p><strong>Total: JMD {total.toFixed(2)}</strong></p>
            <button type="button" className="checkout-btn">Checkout (coming soon)</button>
          </div>
        </>
      )}
    </div>
  );
}
