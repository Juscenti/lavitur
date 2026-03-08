import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { requireStaff, signOut } from '../lib/adminGuard';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    requireStaff((where) => {
      if (cancelled) return;
      if (where === 'login') navigate('/login', { replace: true });
      else if (where === 'frontend') {
        window.location.href = import.meta.env.VITE_MAIN_SITE_URL || 'http://localhost:3001';
      }
    }).then((p) => {
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = () => {
    signOut(() => navigate('/login', { replace: true }));
  };

  if (loading) {
    return (
      <div id="admin-container">
        <div
          id="dashboard-loading"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            fontSize: '1.1rem',
            color: '#555',
          }}
        >
          Checking access…
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div id="admin-container">
      <Sidebar />
      <main id="main">
        <Header profile={profile} onLogout={handleLogout} />
        <section id="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
