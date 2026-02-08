// admin-panel/js/adminGuard.js
import { supabase, getMyProfile } from "./supabaseClient.js";

const TOKEN_KEY = "adminToken";
const ROLE_KEY = "adminRole";
const STAFF_ROLES = new Set([
  "employee",
  "senior_employee",
  "representative",
  "admin"
]);

/** Normalize role for comparison (handles "Admin", "senior employee", etc.) */
function normalizeRole(role) {
  return (role || "").toString().toLowerCase().replace(/\s+/g, "_");
}

export async function requireStaff() {
  // 1) Use stored token/role first (set by login before redirect) so we don't bounce
  //    when Supabase session isn't rehydrated yet after full page load.
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedRole = (localStorage.getItem(ROLE_KEY) || "").toLowerCase();
  if (storedToken && (storedRole === "admin" || storedRole === "representative")) {
    const profileFromSupabase = await getMyProfile().catch(() => null);
    if (profileFromSupabase) return profileFromSupabase;
    // Session not ready yet but we have valid admin login – return minimal profile so dashboard shows
    return { role: storedRole, email: "", username: "" };
  }

  // 2) No stored admin session – try Supabase session (e.g. refresh or different tab)
  const profile = await getMyProfile();
  const role = normalizeRole(profile?.role);
  if (profile && STAFF_ROLES.has(role)) {
    if (storedRole !== role) {
      localStorage.setItem(TOKEN_KEY, (await supabase.auth.getSession()).data?.session?.access_token || "");
      localStorage.setItem(ROLE_KEY, role);
    }
    return profile;
  }

  window.location.href = "./login.html";
  return null;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
}
