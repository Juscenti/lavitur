// Frontend/js/profile.js — uses REST API for profile (auth via Supabase)
import { supabase } from "./supabaseClient.js";
import { api } from "./api.js";

const DEFAULT_PROFILE_PIC = "images/icons/default-avatar.png";

async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session || null;
  if (!session) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function setDisabled(id, disabled) {
  const el = document.getElementById(id);
  if (el) el.disabled = disabled;
}

function wireSidebarNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".profile-section");
  if (!buttons.length || !sections.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.section;
      sections.forEach((sec) => {
        sec.classList.remove("active");
        if (sec.id === "section-" + target) sec.classList.add("active");
      });
    });
  });
}

function wireProfilePicture(userId) {
  const img = document.getElementById("profile-picture");
  const changeBtn = document.getElementById("change-picture-btn");
  const fileInput = document.getElementById("upload-profile-picture");
  if (!img) return;

  const PIC_KEY = `profilePicture:${userId}`;
  img.src = localStorage.getItem(PIC_KEY) || DEFAULT_PROFILE_PIC;
  img.alt = "Profile picture";
  changeBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
      localStorage.setItem(PIC_KEY, ev.target.result);
    };
    reader.readAsDataURL(file);
  });
}

function wireEditSave(userId, initialProfile) {
  const editBtn = document.getElementById("edit-profile-btn");
  const usernameEl = document.getElementById("username");
  const emailEl = document.getElementById("email");
  const fullNameEl = document.getElementById("fullName");
  if (emailEl) emailEl.disabled = true;
  let isEditing = false;
  if (usernameEl) usernameEl.disabled = true;
  if (fullNameEl) fullNameEl.disabled = true;

  editBtn?.addEventListener("click", async () => {
    isEditing = !isEditing;
    if (usernameEl) usernameEl.disabled = !isEditing;
    if (fullNameEl) fullNameEl.disabled = !isEditing;
    editBtn.textContent = isEditing ? "Save" : "Edit";

    if (!isEditing) {
      const newUsername = (usernameEl?.value || "").trim();
      const newFullName = (fullNameEl?.value || "").trim();
      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      if (!newUsername || !usernameRegex.test(newUsername)) {
        alert("Invalid username. Use letters, numbers, dots, and underscores.");
        if (usernameEl) usernameEl.value = initialProfile.username || "";
        if (fullNameEl) fullNameEl.value = initialProfile.full_name || "";
        return;
      }
      try {
        await api.patch("/me", { username: newUsername, full_name: newFullName });
        initialProfile.username = newUsername;
        initialProfile.full_name = newFullName;
      } catch (err) {
        alert(err?.data?.error || err?.message || "Failed to update profile.");
        if (usernameEl) usernameEl.value = initialProfile.username || "";
        if (fullNameEl) fullNameEl.value = initialProfile.full_name || "";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const session = await requireSession();
    if (!session) return;

    const profile = await api.get("/me");
    setInputValue("username", profile.username || "");
    setInputValue("email", profile.email || "");
    setInputValue("fullName", profile.full_name || "");
    setDisabled("fullName", true);

    wireProfilePicture(session.user.id);
    wireSidebarNav();
    wireEditSave(session.user.id, profile);
  } catch (e) {
    console.error("Profile page failed:", e);
    window.location.replace("login.html");
  }
});
