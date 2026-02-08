/**
 * Admin panel API client — all data requests go to the REST API.
 * Uses current Supabase session token (auto-refreshed); falls back to stored adminToken.
 */
const API_BASE = typeof window !== 'undefined' && window.API_BASE ? window.API_BASE : '';

const TOKEN_KEY = 'adminToken';

/** Prefer live session token (refreshed by Supabase); fall back to localStorage. */
async function getToken() {
  try {
    const { supabase } = await import('./supabaseClient.js');
    const { data } = await supabase.auth.getSession();
    const sessionToken = data?.session?.access_token;
    if (sessionToken) {
      localStorage.setItem(TOKEN_KEY, sessionToken);
      return sessionToken;
    }
  } catch (_) {}
  return localStorage.getItem(TOKEN_KEY);
}

async function request(method, path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    method,
    headers,
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** FormData for multipart (e.g. file upload) — don't set Content-Type so browser sets boundary */
async function requestMultipart(method, path, formData) {
  const token = await getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request('PATCH', path, { body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => requestMultipart('POST', path, formData),
};

export default api;
