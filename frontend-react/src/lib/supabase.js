import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ueotizgitowpvizkbgst.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Cv6TIwRzZVRs72-Byx2ozA_r7eDR0DX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
