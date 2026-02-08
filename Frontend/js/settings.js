// Frontend/js/settings.js — uses REST API for profile (auth via Supabase)
import { supabase } from "./supabaseClient.js";
import { api } from "./api.js";

async function requireSessionOrRedirect() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;
  if (!session) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireSessionOrRedirect();
  if (!session) return;

  const form = document.getElementById("settings-form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");

  try {
    const profile = await api.get("/me");
    if (usernameInput) usernameInput.value = profile.username || "";
    if (emailInput) {
      emailInput.value = profile.email || "";
      emailInput.disabled = true;
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
    return;
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newUsername = (usernameInput?.value || "").trim();
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!newUsername || !usernameRegex.test(newUsername)) {
      alert("Invalid username. Use letters, numbers, dots, and underscores.");
      return;
    }
    try {
      await api.patch("/me", { username: newUsername });
      alert("Settings updated successfully.");
    } catch (err) {
      alert(err?.data?.error || err?.message || "Failed to update settings.");
    }
  });
});
