import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23ddd" cx="50" cy="50" r="50"/><circle fill="%23999" cx="50" cy="40" r="18"/><ellipse fill="%23999" cx="50" cy="95" rx="30" ry="22"/></svg>');

export default function Profile() {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [section, setSection] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!session && !authLoading) {
      navigate('/login');
      return;
    }
    if (session) {
      api.get('/me').then((data) => {
        setProfile(data);
        setUsername(data?.username ?? '');
        setFullName(data?.full_name ?? '');
      }).catch(() => navigate('/login'));
    }
  }, [session, authLoading, navigate]);

  const handleSave = async () => {
    try {
      await api.patch('/me', { username, full_name: fullName });
      setProfile((p) => ({ ...p, username, full_name: fullName }));
      setEditing(false);
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Update failed.');
    }
  };

  if (authLoading || !profile) return <div className="page-section">Loading…</div>;

  const sections = ['personal', 'orders', 'wishlist', 'addresses', 'activity', 'loyalty'];

  return (
    <>
      <header className="profile-header">
        <div className="header-left">
          <Link to="/" className="back-btn">← Back</Link>
        </div>
        <div className="header-center">
          <span className="welcome-user">Welcome, {profile.username || profile.email}</span>
        </div>
      </header>
      <main className="profile-container">
        <aside className="profile-sidebar">
          <nav>
            <ul>
              {sections.map((s) => (
                <li key={s}>
                  <button type="button" className={`nav-btn ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
                    {s === 'personal' && 'Personal Info'}
                    {s === 'orders' && 'Order History'}
                    {s === 'wishlist' && 'Wishlist'}
                    {s === 'addresses' && 'Saved Addresses'}
                    {s === 'activity' && 'Activity Timeline'}
                    {s === 'loyalty' && 'Loyalty & Tier'}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="profile-main">
          {section === 'personal' && (
            <section id="section-personal" className="profile-section active">
              <h2>Personal Information</h2>
              <div className="profile-picture-wrapper">
                <img src={DEFAULT_AVATAR} alt="Profile" id="profile-picture" />
                <button type="button" id="change-picture-btn">Change Picture</button>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!editing} />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!editing} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email ?? ''} disabled />
              </div>
              {editing ? (
                <button type="button" className="cta-button" onClick={handleSave}>Save</button>
              ) : (
                <button type="button" className="cta-button" id="edit-profile-btn" onClick={() => setEditing(true)}>Edit</button>
              )}
            </section>
          )}
          {section !== 'personal' && (
            <section className="profile-section active">
              <h2>{section}</h2>
              <p>Coming soon.</p>
            </section>
          )}
        </section>
      </main>
    </>
  );
}
