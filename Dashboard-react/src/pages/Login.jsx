import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/login.css';

const TOKEN_KEY = 'adminToken';
const ROLE_KEY = 'adminRole';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/', { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const form = e.target;
    const email = form.username.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data?.session) {
        setError('Invalid username or password.');
        return;
      }

      const userId = data.session.user.id;
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileErr) {
        setError(`Profile lookup failed: ${profileErr.message}`);
        await supabase.auth.signOut();
        return;
      }
      if (!profile?.role) {
        setError('Profile found, but role is missing.');
        await supabase.auth.signOut();
        return;
      }

      const role = (profile.role || '').toString().toLowerCase();
      const allowed = role === 'admin' || role === 'representative';

      if (!allowed) {
        setError('Unauthorized access.');
        await supabase.auth.signOut();
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      localStorage.setItem(ROLE_KEY, role);

      setTimeout(() => navigate('/', { replace: true }), 50);
    } catch (err) {
      setError('Network error. Check your connection.');
    }
  };

  return (
    <main className="login-container">
      <form id="loginForm" className="login-form" noValidate onSubmit={handleSubmit}>
        <h1>Admin Login</h1>

        <div className="form-group">
          <label htmlFor="username">Email</label>
          <input
            type="email"
            id="username"
            name="username"
            required
            autoComplete="email"
            placeholder="e.g. kuaneforrest@gmail.com"
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
            Use the email for your admin account (not username).
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit">Log In</button>
        <p className="error-message" id="errorMsg">
          {error}
        </p>
      </form>
    </main>
  );
}
