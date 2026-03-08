import { supabase, getMyProfile } from './supabase.js';

const TOKEN_KEY = 'adminToken';
const ROLE_KEY = 'adminRole';
const STAFF_ROLES = new Set([
  'employee',
  'senior_employee',
  'representative',
  'admin',
]);

function normalizeRole(role) {
  return (role || '').toString().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Returns staff profile or null. If onRedirect provided, calls it with 'login' or 'frontend' instead of window.location.
 */
export async function requireStaff(onRedirect) {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedRole = (localStorage.getItem(ROLE_KEY) || '').toLowerCase();
  const { data: sessionData } = await supabase.auth.getSession();
  const hasSession = !!sessionData?.session;

  if (storedToken && (storedRole === 'admin' || storedRole === 'representative')) {
    const profileFromSupabase = await getMyProfile().catch(() => null);
    if (profileFromSupabase) return profileFromSupabase;
    if (!hasSession) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      if (onRedirect) onRedirect('login');
      else window.location.replace('/login');
      return null;
    }
    return { role: storedRole, email: '', username: '' };
  }

  const profile = await getMyProfile();
  const role = normalizeRole(profile?.role);
  if (profile && STAFF_ROLES.has(role)) {
    if (storedRole !== role) {
      localStorage.setItem(TOKEN_KEY, (await supabase.auth.getSession()).data?.session?.access_token || '');
      localStorage.setItem(ROLE_KEY, role);
    }
    return profile;
  }

  if (onRedirect) onRedirect('frontend');
  else window.location.replace(import.meta.env.VITE_MAIN_SITE_URL || 'http://localhost:3001');
  return null;
}

export async function signOut(onRedirectToLogin) {
  await supabase.auth.signOut();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  if (onRedirectToLogin) onRedirectToLogin();
  else window.location.href = '/login';
}
