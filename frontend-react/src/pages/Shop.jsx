import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

function formatMoney(amount, currency = 'JMD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount ?? 0));
}

export default function Shop() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ womenswear: false, menswear: false, niche: false });

  useEffect(() => {
    if (categoryParam) setFilters((f) => ({ ...f, [categoryParam]: true }));
  }, [categoryParam]);

  useEffect(() => {
    api.get('/products').then(setProducts).catch(() => setProducts([]));
    api.get('/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => setCategories([]));
  }, []);

  const activeCats = Object.entries(filters).filter(([, v]) => v).map(([k]) => k);
  const filtered = activeCats.length ? products.filter((p) => activeCats.includes(p.category_slug)) : products;

  const addToCart = (p) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i) => String(i.id) === String(p.id));
    if (existing) existing.quantity++;
    else cart.push({ ...p, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart.');
  };

  const addToWishlist = (p) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (wishlist.some((i) => String(i.id) === String(p.id))) return;
    wishlist.push(p);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    alert('Added to wishlist.');
  };

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="shop-page">
      <aside className="filters">
        <h2>Filter By</h2>
        <div className="filter-group">
          {['womenswear', 'menswear', 'niche'].map((key) => (
            <label key={key}>
              <input type="checkbox" checked={filters[key] || false} onChange={() => toggleFilter(key)} className="category-filter" />
              {key === 'womenswear' ? "Women's Wear" : key === 'menswear' ? "Men's Wear" : 'Niche Line'}
            </label>
          ))}
        </div>
      </aside>
      <div className="product-grid" id="product-grid">
        {filtered.map((p) => (
          <div key={p.id} className="product-card">
            <img src={p.image_url || '/images/placeholder.jpg'} alt={p.title} loading="lazy" />
            <h3>{p.title}</h3>
            <p>{formatMoney(p.price, 'JMD')}</p>
            <div className="actions">
              <button type="button" className="add-cart" onClick={() => addToCart(p)}>Add to Cart</button>
              <button type="button" className="add-wishlist" onClick={() => addToWishlist(p)}><i className="fas fa-heart" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
