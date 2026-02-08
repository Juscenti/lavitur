// admin-panel/js/adminGuard.js
import { supabase, getMyProfile } from "./supabaseClient.js";

const STAFF_ROLES = new Set([
  "employee",
  "senior_employee",
  "representative",
  "admin"
]);

export async function requireStaff() {
  const profile = await getMyProfile();

  if (!profile || !STAFF_ROLES.has(profile.role)) {
    // Not logged in or not staff
    window.location.href = "./login.html";
    return null;
  }

  return profile;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
}
