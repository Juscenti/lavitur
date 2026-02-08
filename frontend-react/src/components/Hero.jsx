import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  '/images/slideshow/feature1.png',
  '/images/slideshow/feature2.png',
  '/images/slideshow/feature3.png',
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="hero">
      <div className="hero-slider">
        <div className="slides" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((src, i) => (
            <img key={i} src={src} className="slide" alt={`Slide ${i + 1}`} />
          ))}
        </div>
        <button type="button" className="nav prev" onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}>&#10094;</button>
        <button type="button" className="nav next" onClick={() => setCurrent((c) => (c + 1) % slides.length)}>&#10095;</button>
      </div>
      <div className="hero-content">
        <h1 className="WordLogo">Lavitúr</h1>
        <h2 className="tagline">Grace in Grit</h2>
        <button className="cta-button">
          <Link to="/shop">Wear The Shift</Link>
        </button>
      </div>
    </header>
  );
}
