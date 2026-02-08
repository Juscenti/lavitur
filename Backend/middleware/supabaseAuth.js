// Backend/middleware/supabaseAuth.js
// Verify Supabase JWT and attach user + profile to req.
// Use requireAuth for user routes, requireAdmin for admin-only routes.

import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase.js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

/** Create a client that validates JWTs (uses anon key; JWT is still validated by Supabase) */
function getAuthClient() {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/**
 * Verify Authorization: Bearer <supabase_access_token> and load user + profile.
 * Sets req.user (Supabase user), req.profile (profiles row), req.userId.
 */
export async function verifySupabaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const authClient = getAuthClient();
  if (!authClient) {
    return res.status(503).json({ error: 'Auth not configured' });
  }

  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, role, full_name, status, created_at, updated_at')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.userId = user.id;
    req.profile = profile || null;
    if (profileErr && profileErr.code !== 'PGRST116') {
      console.warn('Profile fetch warning:', profileErr.message);
    }
    next();
  } catch (err) {
    console.error('verifySupabaseToken:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const ADMIN_ROLES = new Set(['admin', 'representative']);

/** Require valid token and role in [admin, representative]. */
export function requireAdmin(req, res, next) {
  const role = req.profile?.role;
  if (!role || !ADMIN_ROLES.has(role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/** Optional auth: attach user/profile if Bearer present, don't 401 if missing. */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    req.profile = null;
    req.userId = null;
    return next();
  }

  const authClient = getAuthClient();
  if (!authClient) return next();

  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return next();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, role, full_name, status')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.userId = user.id;
    req.profile = profile || null;
  } catch (_) {}
  next();
}
