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
  // 1) Stored token/role only trust when there is a real Supabase session (avoid showing dashboard when logged out)
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedRole = (localStorage.getItem(ROLE_KEY) || "").toLowerCase();
  const { data: sessionData } = await supabase.auth.getSession();
  const hasSession = !!sessionData?.session;

  if (storedToken && (storedRole === "admin" || storedRole === "representative")) {
    const profileFromSupabase = await getMyProfile().catch(() => null);
    if (profileFromSupabase) return profileFromSupabase;
    // No profile: if no session at all, clear stale storage and redirect (user is logged out)
    if (!hasSession) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      window.location.replace("../Frontend/index.html");
      return null;
    }
    // Session exists but profile not ready yet – minimal profile so dashboard shows
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

  // Redirect non-staff to frontend home – don't show admin UI at all
  window.location.replace("../Frontend/index.html");
  return null;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
}
