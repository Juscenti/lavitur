import { useState } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  '/images/slideshow/feature1.png',
  '/images/slideshow/feature2.png',
  '/images/slideshow/feature3.png',
];

const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

export default function Hero() {
  const [index, setIndex] = useState(1);
  const [noTransition, setNoTransition] = useState(false);

  const handleTransitionEnd = () => {
    if (index === 0) {
      setNoTransition(true);
      setIndex(slides.length);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    } else if (index === extendedSlides.length - 1) {
      setNoTransition(true);
      setIndex(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    }
  };

  const goNext = () => {
    setIndex((i) => (i === slides.length ? i + 1 : i + 1));
  };

  const goPrev = () => {
    setIndex((i) => (i === 1 ? 0 : i - 1));
  };

  return (
    <header className="hero">
      <div className="hero-slider">
        <div
          className="slides"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: noTransition ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((src, i) => (
            <img key={i} src={src} className="slide" alt="Lavitúr Collection" />
          ))}
        </div>
        <button type="button" className="nav prev" aria-label="Previous slide" onClick={goPrev}>&#10094;</button>
        <button type="button" className="nav next" aria-label="Next slide" onClick={goNext}>&#10095;</button>
      </div>
      <div className="hero-content">
        <h1 className="WordLogo">Lavitúr</h1>
        <h2 className="tagline">Grace in Grit</h2>
        <button className="cta-button">
          <Link to="/shop">Discover the Collection</Link>
        </button>
      </div>
    </header>
  );
}
