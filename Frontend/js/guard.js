// Frontend/js/guard.js
import { supabase } from "./supabaseClient.js";

export async function requireCustomerAuth() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) {
    window.location.replace("login.html");
    return null;
  }

  return session;
}
