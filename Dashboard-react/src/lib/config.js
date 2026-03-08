// API base URL — defaults to Render; override with VITE_API_BASE or use VITE_USE_LOCAL_API=1 for local backend
const RENDER_API_URL = 'https://lavitur.onrender.com';

const getApiBase = () => {
  if (typeof window === 'undefined') return RENDER_API_URL;
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (window.API_BASE) return window.API_BASE;
  const useLocal = import.meta.env.VITE_USE_LOCAL_API === '1' || (typeof localStorage !== 'undefined' && localStorage.getItem('lavitur_use_local_api') === '1');
  const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);
  return (isLocal && useLocal) ? 'http://localhost:5000' : RENDER_API_URL;
};

export const API_BASE = getApiBase();
if (typeof window !== 'undefined') window.API_BASE = API_BASE;
