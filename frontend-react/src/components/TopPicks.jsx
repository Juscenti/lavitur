import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function TopPicks() {
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api.get('/products').then((data) => setProducts(Array.isArray(data) ? data.slice(0, 8) : [])).catch(() => setProducts([]));
  }, []);

  if (!products.length) return null;

  const step = 3;
  const maxIndex = Math.max(0, products.length - step);
  const slice = products.slice(index, index + step);

  return (
    <section id="top-picks" className="top-picks">
      <h2>Top Picks for You</h2>
      <div className="carousel-wrapper">
        <button type="button" className="tp-nav prev" onClick={() => setIndex((i) => Math.max(0, i - 1))}>&#10094;</button>
        <div className="tp-slides" style={{ transform: `translateX(0)` }}>
          {slice.map((p) => (
            <div key={p.id} className="tp-slide">
              <Link to="/shop">
                <img src={p.image_url || '/images/placeholder.jpg'} alt={p.title} />
                <div className="info">
                  <h3>{p.title}</h3>
                  <p>JMD {Number(p.price).toFixed(2)}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <button type="button" className="tp-nav next" onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}>&#10095;</button>
      </div>
    </section>
  );
}
