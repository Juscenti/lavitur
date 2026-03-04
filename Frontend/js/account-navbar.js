/**
 * Account navbar init: active tab, dropdown, sign-out.
 * Runs when partial "account-navbar" is loaded or when .account-navbar is already in the DOM.
 */
(function() {
  function init() {
    var navbar = document.querySelector('.account-navbar');
    if (!navbar) return;

    var homeLink = document.querySelector('.account-nav-home');
    if (homeLink && window.FRONTEND_HOME) homeLink.setAttribute('href', window.FRONTEND_HOME);

    var path = window.location.pathname || '';
    var isSettings = path.indexOf('settings') !== -1;
    var tabProfile = document.getElementById('account-tab-profile');
    var tabSettings = document.getElementById('account-tab-settings');
    if (tabProfile) tabProfile.classList.toggle('active', !isSettings);
    if (tabSettings) tabSettings.classList.toggle('active', isSettings);

    var toggle = document.querySelector('.account-menu-toggle');
    var dropdown = document.querySelector('.account-dropdown');
    if (toggle && dropdown) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.account-nav-menu')) dropdown.classList.remove('show');
      });
    }

    var signOutLink = document.getElementById('account-signout');
    if (signOutLink) {
      signOutLink.addEventListener('click', function(e) {
        e.preventDefault();
        var base = document.querySelector('base');
        var baseHref = (base && base.getAttribute('href')) || '';
        var scriptPath = baseHref + 'js/supabaseClient.js';
        import(scriptPath).then(function(m) {
          return m.supabase && m.supabase.auth ? m.supabase.auth.signOut() : Promise.resolve();
        }).catch(function() {})
         .then(function() {
           var path = window.location.pathname || "";
           var base = path.substring(0, path.lastIndexOf("/") + 1) || "/";
           window.location.replace(window.FRONTEND_HOME || base);
         });
      });
    }
  }

  function runWhenReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  runWhenReady(function() {
    init();
    window.addEventListener('partial-loaded', function(e) {
      if (e.detail && e.detail.name === 'account-navbar') init();
    });
  });
})();
