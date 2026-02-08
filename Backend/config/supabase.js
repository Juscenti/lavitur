// Backend/config/supabase.js
// Supabase server client (service role) for API — use for all DB operations.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceRoleKey) {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. API data routes may fail.');
}

export const supabaseAdmin = createClient(url || '', serviceRoleKey || '', {
  auth: { persistSession: false }
});

/**
 * Client that sends the user's JWT so DB triggers/RLS see auth.uid().
 * Use for mutations (e.g. product insert) when a trigger checks the current user's profile/role.
 */
export function supabaseWithUserToken(bearerToken) {
  if (!url || !anonKey || !bearerToken) return supabaseAdmin;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}` } },
  });
}

/** Public URL for product media (same bucket name as frontend) */
export function getProductMediaPublicUrl(filePath) {
  if (!filePath) return '';
  const base = (url || '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/product-media/${filePath}`;
}
