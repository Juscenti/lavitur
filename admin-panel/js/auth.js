// admin-panel/js/auth.js

export function requireAdminAuth() {
  const token = localStorage.getItem('adminToken');
  const role  = localStorage.getItem('adminRole');

  if (!token || (role !== 'admin' && role !== 'representative')) {
    // use absolute path
    location.replace('/admin-panel/login.html');
    return;
  }

  // Prevent cached pages being shown after logout
  window.addEventListener('pageshow', (event) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const back = nav && nav.type === 'back_forward';
    if (event.persisted || back) location.reload();
  });
}

export function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

import { supabase } from "./supabaseClient.js";

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#logoutBtn");
  if (!btn) return;

  try { await supabase.auth.signOut(); } catch {}

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRole");

  // Keep this path consistent across the whole admin panel:
  window.location.href = "/admin-panel/login.html";
});

