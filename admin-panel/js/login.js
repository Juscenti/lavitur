// admin-panel/js/login.js
import { supabase } from "./supabaseClient.js";

// Keep your existing keys for compatibility with older guards
const TOKEN_KEY = "adminToken";
const ROLE_KEY = "adminRole";

// If already logged in, go to dashboard
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    window.location.href = "index.html";
  }
})();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usernameOrEmail = e.target.username.value.trim();
  const password = e.target.password.value.trim();
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = "";

  if (!usernameOrEmail || !password) {
    errorMsg.textContent = "Please fill in both fields.";
    return;
  }

  try {
    // Supabase Auth email/password requires email.
    // If you want username login, we can add a "lookup username → email" step.
    // For now, treat input as email.
    const email = usernameOrEmail;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      errorMsg.textContent = "Invalid username or password.";
      return;
    }

    // Get role from profiles (RLS allows user to read own profile)
    const userId = data.session.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileErr) {
      errorMsg.textContent = `Profile lookup failed: ${profileErr.message}`;
      await supabase.auth.signOut();
      return;
    }
    if (!profile?.role) {
      errorMsg.textContent = "Profile found, but role is missing.";
      await supabase.auth.signOut();
      return;
    }

    // Enforce admin access the same way your old code did
    const role = profile.role;
    const allowed = role === "admin" || role === "representative";

    if (!allowed) {
      errorMsg.textContent = "Unauthorized access.";
      await supabase.auth.signOut();
      return;
    }

    // Store a compatible token value (Supabase access token)
    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    localStorage.setItem(ROLE_KEY, role);

    window.location.href = "index.html";
  } catch (err) {
    errorMsg.textContent = "Network error. Check your connection.";
  }
});
