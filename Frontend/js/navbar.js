// Frontend/js/navbar.js
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const initNavbarLogic = async () => {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    const mobileDrawer = document.querySelector(".mobile-drawer");
    const accountDropdown = document.querySelector(".account-dropdown");
    const accountDropdownMenu = accountDropdown?.querySelector(".dropdown-menu");

    if (!navbar || !accountDropdown || !accountDropdownMenu) return;

    // Scroll background toggle
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    });

    // Mobile drawer toggle
    mobileToggle?.addEventListener("click", () => {
      mobileDrawer?.classList.toggle("open");
    });

    const buildMenu = async () => {
      // session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;

      // logged out
      if (!session) {
        accountDropdownMenu.innerHTML = `
          <li><a href="login.html">Login/Register</a></li>
        `;
        return;
      }

      // logged in: fetch role from profiles
      const userId = session.user.id;

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", userId)
        .single();

      // If profile fetch fails, still provide basic options
      const role = profile?.role ? String(profile.role).toLowerCase() : "customer";

      // Admin/rep sees admin dashboard link
      const isStaff = role === "admin" || role === "representative";

      accountDropdownMenu.innerHTML = [
        isStaff ? `<li><a href="../../admin-panel/index.html">Admin Dashboard</a></li>` : "",
        `<li><a href="profile.html">Profile</a></li>`,
        `<li><a href="settings.html">Settings</a></li>`,
        `<li><a href="#" data-action="logout">Log Out</a></li>`
      ].filter(Boolean).join("");
    };

    // Initial render
    await buildMenu();

    // Logout handler (delegated)
    accountDropdownMenu.addEventListener("click", async (e) => {
      const link = e.target.closest("a[data-action='logout']");
      if (!link) return;

      e.preventDefault();

      try { await supabase.auth.signOut(); } catch {}

      // Redirect home
      window.location.href = "index.html";
    });

    // Keep UI in sync if auth changes in another tab
    supabase.auth.onAuthStateChange(async () => {
      await buildMenu();
    });
  };

  // If navbar is loaded dynamically, use MutationObserver
  const observer = new MutationObserver(() => {
    const navbarExists = document.querySelector(".navbar");
    if (navbarExists) {
      initNavbarLogic();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback if navbar is already in DOM
  if (document.querySelector(".navbar")) initNavbarLogic();
});
