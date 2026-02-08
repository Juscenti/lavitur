import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Settings() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session && !authLoading) {
      navigate('/login');
      return;
    }
    if (session) {
      api.get('/me').then((d) => setUsername(d?.username ?? '')).catch(() => navigate('/login'));
    }
  }, [session, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/me', { username });
      alert('Settings saved.');
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="page-section">Loading…</div>;

  return (
    <div className="account-wrapper">
      <div className="account-container">
        <h1>Settings</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>
        <p style={{ marginTop: '1rem' }}><Link to="/profile">Back to Profile</Link></p>
      </div>
    </div>
  );
}
