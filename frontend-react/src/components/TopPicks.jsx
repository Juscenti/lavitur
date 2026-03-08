import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const CURRENCY = 'JMD';
function formatPrice(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(Number(amount ?? 0));
}

const CURATED_COUNT = 8;
const SLIDE_WIDTH = 280;
const SLIDE_GAP = 24;
const slideStep = SLIDE_WIDTH + SLIDE_GAP;

export default function TopPicks() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(1);
  const [noTransition, setNoTransition] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products')
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const curated = list
          .slice(0, CURATED_COUNT)
          .map((p) => ({
            id: p.id,
            title: p.title || 'Product',
            price: formatPrice(p.price),
            img: p.image_url || '/images/placeholder.jpg',
            link: `/shop/${encodeURIComponent(String(p.id))}`,
          }));
        setItems(curated);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const n = items.length;
  const extendedItems = n > 0
    ? [items[n - 1], ...items, ...items]
    : [];

  const handleTransitionEnd = () => {
    if (index === 0) {
      setNoTransition(true);
      setIndex(n);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    } else if (index === n + 1) {
      setNoTransition(true);
      setIndex(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    }
  };

  const goNext = () => setIndex((i) => i + 1);
  const goPrev = () => setIndex((i) => i - 1);

  if (loading || !items.length) return null;

  return (
    <section id="top-picks" className="top-picks">
      <h2>Curated for You</h2>
      <div className="carousel-wrapper">
        <button type="button" className="tp-nav prev" aria-label="Previous" onClick={goPrev}>
          &#10094;
        </button>
        <div className="carousel-viewport">
          <div
            className="tp-fade tp-fade-left"
            aria-hidden="true"
          />
          <div
            className="tp-fade tp-fade-right"
            aria-hidden="true"
          />
          <div
            className="tp-slides"
            style={{
              transform: `translateX(-${index * slideStep}px)`,
              transition: noTransition ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedItems.map((item, i) => (
              <Link key={`tp-${i}`} to={item.link} className="tp-slide">
                <img src={item.img} alt={item.title} />
                <div className="info">
                  <h4>{item.title}</h4>
                  <p>{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <button type="button" className="tp-nav next" aria-label="Next" onClick={goNext}>
          &#10095;
        </button>
      </div>
    </section>
  );
}
