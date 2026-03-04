// Supabase config for AI server
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Database queries will fail.');
}

const supabaseAdmin = createClient(url || '', serviceRoleKey || '', {
  auth: { persistSession: false }
});

module.exports = { supabaseAdmin };
