import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Layout from './components/Layout';
import SimpleLayout from './components/SimpleLayout';
import AccountLayout from './components/AccountLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import About from './pages/About';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Home page — luxury transparent navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Content pages — simple white sticky navbar */}
      <Route element={<SimpleLayout />}>
        <Route path="shop"     element={<Shop />} />
        <Route path="shop/:id" element={<Product />} />
        <Route path="about"    element={<About />} />
        <Route path="contact"  element={<Contact />} />
        <Route path="cart"     element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Account pages — account navbar with Profile/Settings tabs */}
      <Route element={<AccountLayout />}>
        <Route path="profile"  element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all: when no route matches (e.g. wrong URL or server 404 served index.html) */}
      <Route path="*" element={
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'Urbanist, sans-serif' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Page not found</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>The page you’re looking for doesn’t exist or the URL may be wrong.</p>
          <Link to="/" style={{ color: '#a67c52', fontWeight: 600 }}>Go to home</Link>
        </div>
      } />
    </Routes>
    </>
  );
}
