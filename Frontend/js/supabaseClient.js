import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ueotizgitowpvizkbgst.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Cv6TIwRzZVRs72-Byx2ozA_r7eDR0DX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
