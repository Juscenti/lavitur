import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const HASH_PARAM_ACCESS = 'access_token';
const HASH_PARAM_REFRESH = 'refresh_token';

/**
 * Parses location.hash for access_token and refresh_token (e.g. from frontend handoff).
 * If present, sets the Supabase session so dashboard shares the same login, then clears the hash.
 */
export default function AuthHandoff({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash?.replace(/^#/, '') || '';
    const params = new URLSearchParams(hash);
    const access_token = params.get(HASH_PARAM_ACCESS);
    const refresh_token = params.get(HASH_PARAM_REFRESH);

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => {
          // Clear hash so tokens don't stay in URL (security + history)
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setReady(true);
        })
        .catch((err) => {
          console.warn('Auth handoff failed:', err);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '1rem',
          color: '#555',
        }}
      >
        Signing you in…
      </div>
    );
  }

  return children;
}
