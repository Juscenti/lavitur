/**
 * Load HTML partials into placeholders.
 *
 * Usage: <div data-partial="navbar"></div>  → fetches _partials/navbar.html and injects it.
 * Path is relative to the current page (e.g. from /frontend/settings.html → _partials/account-navbar.html).
 * Optional: data-partial-base="custom/path/" to override the folder (default "_partials/").
 *
 * After injection, dispatches "partial-loaded" so other scripts (e.g. navbar.js) can run.
 */
(function() {
  function load(placeholder) {
    var name = placeholder.getAttribute("data-partial");
    if (!name) return Promise.resolve();

    var base = placeholder.getAttribute("data-partial-base") || "_partials/";
    var path = base.replace(/\/?$/, "/") + name.replace(/\.html$/, "") + ".html";

    return fetch(path)
      .then(function(r) {
        if (!r.ok) throw new Error(path + " " + r.status);
        return r.text();
      })
      .then(function(html) {
        placeholder.innerHTML = html;
        window.dispatchEvent(new CustomEvent("partial-loaded", { detail: { name: name, placeholder: placeholder } }));
      })
      .catch(function(err) {
        console.error("load-partial failed:", path, err);
      });
  }

  function run() {
    var placeholders = document.querySelectorAll("[data-partial]");
    for (var i = 0; i < placeholders.length; i++) load(placeholders[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
