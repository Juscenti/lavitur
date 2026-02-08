// Backend/config/supabase.js
// Supabase server client (service role) for API — use for all DB operations.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. API data routes may fail.');
}

export const supabaseAdmin = createClient(url || '', serviceRoleKey || '', {
  auth: { persistSession: false }
});

/** Public URL for product media (same bucket name as frontend) */
export function getProductMediaPublicUrl(filePath) {
  if (!filePath) return '';
  const base = (url || '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/product-media/${filePath}`;
}
