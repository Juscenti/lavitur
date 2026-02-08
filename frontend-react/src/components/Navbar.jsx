import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isIndex = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navClass = ['navbar', isIndex && !scrolled ? '' : 'scrolled', scrolled && 'scrolled'].filter(Boolean).join(' ');

  return (
    <nav className={navClass}>
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <img src="/images/icons/LOGO2.png" alt="Lavitúr" />
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li className="dropdown">
            <a href="#">Services</a>
            <ul className="dropdown-menu">
              <li><a href="#">Design</a></li>
              <li><a href="#">Development</a></li>
            </ul>
          </li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        <div className="nav-icons">
          <Link to="/wishlist"><i className="fas fa-heart" /></Link>
          <div className="account-dropdown" onMouseEnter={() => setAccountOpen(true)} onMouseLeave={() => setAccountOpen(false)}>
            <a href="#"><i className="fas fa-user" /></a>
            <ul className="dropdown-menu" style={{ display: accountOpen ? 'block' : 'none', opacity: accountOpen ? 1 : 0, transform: accountOpen ? 'translateY(0)' : 'translateY(10px)' }}>
              {user ? (
                <>
                  <li><Link to="/profile">Profile</Link></li>
                  <li><Link to="/settings">Settings</Link></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); signOut(); }}>Log out</a></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Log in</Link></li>
                  <li><Link to="/register">Register</Link></li>
                </>
              )}
            </ul>
          </div>
          <Link to="/cart"><i className="fas fa-shopping-bag" /></Link>
        </div>
        <button className="mobile-menu-toggle" aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className="hamburger" />
        </button>
      </div>
    </nav>
  );
}
