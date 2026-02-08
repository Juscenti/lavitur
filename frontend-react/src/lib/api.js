import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

async function request(method, path, options = {}) {
  const token = await getAccessToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, { method, headers, ...options });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}
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
};
