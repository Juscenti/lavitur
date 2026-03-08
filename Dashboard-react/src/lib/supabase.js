import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ueotizgitowpvizkbgst.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Cv6TIwRzZVRs72-Byx2ozA_r7eDR0DX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getMyProfile() {
  const session = await getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,username,role,created_at,updated_at')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  return data;
}
