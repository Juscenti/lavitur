// Frontend/js/navbar.js — mobile & scroll run first; Supabase loaded only for account menu

function runWhenReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

runWhenReady(() => {
  const initNavbarLogic = () => {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    const mobileDrawer = document.querySelector(".mobile-drawer");
    const backdrop = document.getElementById("mobile-drawer-backdrop");

    if (!navbar) return;

    // Scroll background toggle
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    });

    // Mobile drawer toggle — use delegation so it works even if elements load late
    document.addEventListener("click", (e) => {
      const toggle = e.target.closest(".mobile-menu-toggle");
      if (toggle) {
        e.preventDefault();
        const drawer = document.querySelector(".mobile-drawer");
        const back = document.getElementById("mobile-drawer-backdrop");
        if (drawer) {
          const isOpen = drawer.classList.toggle("open");
          toggle.classList.toggle("active", isOpen);
          back?.classList.toggle("open", isOpen);
          document.body.classList.toggle("mobile-nav-open", isOpen);
        }
      }
      if (e.target.closest("#mobile-drawer-backdrop") || e.target.closest(".mobile-drawer-close")) {
        const drawer = document.querySelector(".mobile-drawer");
        const tog = document.querySelector(".mobile-menu-toggle");
        const back = document.getElementById("mobile-drawer-backdrop");
        if (drawer) drawer.classList.remove("open");
        if (tog) tog.classList.remove("active");
        if (back) back.classList.remove("open");
        document.body.classList.remove("mobile-nav-open");
      }
    });

    // Account dropdown — load Supabase only when needed
    const accountDropdown = document.querySelector(".account-dropdown");
    const accountDropdownMenu = accountDropdown?.querySelector(".dropdown-menu");
    if (!accountDropdown || !accountDropdownMenu) return;

    import("./supabaseClient.js")
      .then(({ supabase }) => {
        const pathname = document.location.pathname || "";
        const frontendBase = pathname.startsWith("/Frontend") ? "/Frontend" : "";

        const buildMenu = async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session || null;

          if (!session) {
            accountDropdownMenu.innerHTML = `<li><a href="${frontendBase}/login.html">Login/Register</a></li>`;
            return;
          }

          const userId = session.user.id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, username")
            .eq("id", userId)
            .single();
          const role = profile?.role ? String(profile.role).toLowerCase() : "customer";
          const isStaff = role === "admin" || role === "representative";

          accountDropdownMenu.innerHTML = [
            isStaff ? `<li><a href="/admin-panel/index.html">Admin Dashboard</a></li>` : "",
            `<li><a href="${frontendBase}/profile.html">Profile</a></li>`,
            `<li><a href="${frontendBase}/settings.html">Settings</a></li>`,
            `<li><a href="#" data-action="logout">Log Out</a></li>`
          ].filter(Boolean).join("");
        };

        buildMenu().then(() => {
          accountDropdownMenu.addEventListener("click", async (e) => {
            const link = e.target.closest("a[data-action='logout']");
            if (!link) return;
            e.preventDefault();
            try { await supabase.auth.signOut(); } catch {}
            window.location.href = (window.FRONTEND_HOME || (frontendBase ? frontendBase + "/" : "/"));
          });
          supabase.auth.onAuthStateChange(() => buildMenu());
        });
      })
      .catch(() => {});
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
