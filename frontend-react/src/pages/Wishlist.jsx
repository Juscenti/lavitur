import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('wishlist') || '[]'));
  }, []);

  const remove = (id) => {
    const next = items.filter((i) => String(i.id) !== String(id));
    setItems(next);
    localStorage.setItem('wishlist', JSON.stringify(next));
  };

  return (
    <div className="page-section">
      <h1 className="section-title">Wishlist</h1>
      {items.length === 0 ? (
        <p>Your wishlist is empty. <Link to="/shop">Discover something you love</Link>.</p>
      ) : (
        <div className="wishlist-grid">
          {items.map((i) => (
            <div key={i.id} className="wishlist-item">
              <img src={i.image_url || '/images/placeholder.jpg'} alt={i.title} />
              <div className="product-info">
                <h3>{i.title}</h3>
                <p className="price">JMD {Number(i.price).toFixed(2)}</p>
                <Link to="/shop" className="cta-button">Add to Cart</Link>
                <button type="button" className="remove-btn" onClick={() => remove(i.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
