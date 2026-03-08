import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/account-navbar.css';

export default function AccountNavbar() {
  const { user, signOut, profile } = useAuth();
  const location = useLocation();
  const isStaff = profile?.role === 'admin' || profile?.role === 'representative';
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSettings = location.pathname.includes('settings');

  const handleSignOut = async (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'https://lavitur-dashboard.onrender.com';
  const handleOpenDashboard = async (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token && data?.session?.refresh_token) {
      const hash = `#access_token=${encodeURIComponent(data.session.access_token)}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;
      window.location.href = dashboardUrl + hash;
    } else {
      window.location.href = dashboardUrl;
    }
  };

  return (
    <nav className="account-navbar">
      <div className="account-nav-container">
        {/* Left: Home + tab links */}
        <div className="account-nav-left">
          <Link to="/" className="account-nav-home" aria-label="Back to Home">
            <i className="fas fa-arrow-left" />
            <span>Home</span>
          </Link>
          <span className="account-nav-divider" aria-hidden="true">|</span>
          <Link
            to="/profile"
            className={`account-nav-tab${!isSettings ? ' active' : ''}`}
            id="account-tab-profile"
          >
            My Profile
          </Link>
          <Link
            to="/settings"
            className={`account-nav-tab${isSettings ? ' active' : ''}`}
            id="account-tab-settings"
          >
            Settings
          </Link>
        </div>

        {/* Center: brand title */}
        <div className="account-nav-center">
          <span className="account-nav-title">Lavitúr</span>
        </div>

        {/* Right: icons */}
        <div className="account-nav-right">
          <Link to="/wishlist" className="account-nav-icon" aria-label="Wishlist" title="Wishlist">
            <i className="fas fa-heart" />
          </Link>

          <div className="account-nav-menu">
            <button
              type="button"
              className="account-nav-icon account-menu-toggle"
              aria-label="Account"
              title="Account"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <i className="fas fa-user" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="acct-nav-backdrop"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="acct-nav-dropdown show">
                  {user && (
                    <>
                      {isStaff && (
                        <a href={dashboardUrl} onClick={handleOpenDashboard}>Admin Dashboard</a>
                      )}
                      <a href="#" onClick={handleSignOut}>Sign Out</a>
                    </>
                  )}
                  {!user && (
                    <Link to="/login" onClick={() => setDropdownOpen(false)}>Login / Register</Link>
                  )}
                </div>
              </>
            )}
          </div>

          <Link to="/cart" className="account-nav-icon" aria-label="Cart" title="Cart">
            <i className="fas fa-shopping-bag" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
