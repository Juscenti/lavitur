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

    // Fetch profile: use * so missing columns (e.g. full_name, status) don't break the request
    let profile = null;
    let profileErr = null;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = profileData || null;
    profileErr = profileError;

    if (!profile && profileErr) {
      console.warn('Profile fetch error for user', user.id, profileErr.message, profileErr.code);
    }

    // Auto-create profile if user has no row (e.g. new signup without trigger)
    if (!profile) {
      const insertPayload = {
        id: user.id,
        email: user.email ?? null,
        role: 'customer',
      };
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert(insertPayload);
      if (!insertErr) {
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = newProfile || null;
      } else {
        console.warn('Profile insert (minimal) failed:', insertErr.message, insertErr.code);
        const { error: insertErr2 } = await supabaseAdmin.from('profiles').insert({
          ...insertPayload,
          username: (user.email || '').split('@')[0] || '',
          status: 'active',
        });
        if (!insertErr2) {
          const { data: newProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          profile = newProfile || null;
        } else {
          console.warn('Profile insert (with username/status) failed:', insertErr2.message);
        }
      }
    }

    req.user = user;
    req.userId = user.id;
    req.profile = profile || null;
    next();
  } catch (err) {
    console.error('verifySupabaseToken:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const ADMIN_ROLES = new Set(['admin', 'representative']);

function normalizeRole(role) {
  return (role ?? '').toString().toLowerCase().trim();
}

/** Require valid token and role in [admin, representative]. */
export function requireAdmin(req, res, next) {
  const profile = req.profile;
  const role = normalizeRole(profile?.role);
  if (!profile) {
    return res.status(403).json({
      error: 'No role found for current user in profiles.',
      hint: 'Ensure Backend .env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY match the same Supabase project as the admin panel (see admin-panel/js/supabaseClient.js URL).',
    });
  }
  if (!role || !ADMIN_ROLES.has(role)) {
    return res.status(403).json({ error: 'Admin access required. Your role does not have access.' });
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
