/**
 * Simple navbar: dropdown and page title. Runs when partial "simple-navbar" is loaded.
 */
(function() {
  function init() {
    var navbar = document.querySelector('.simple-navbar');
    if (!navbar) return;

    var homeLink = document.querySelector('.simple-nav-home');
    if (homeLink && window.FRONTEND_HOME) homeLink.setAttribute('href', window.FRONTEND_HOME);

    var accountToggle = document.querySelector('.simple-account-toggle');
    var dropdown = document.querySelector('.simple-dropdown-menu');
    if (accountToggle && dropdown) {
      accountToggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.simple-account-menu')) dropdown.classList.remove('show');
      });
    }

    var pageTitle = document.querySelector('.simple-nav-title');
    if (pageTitle && document.title) {
      var title = document.title.split('–')[0].trim();
      pageTitle.textContent = title || 'Lavitúr';
    }
  }

  function run() {
    init();
    window.addEventListener('partial-loaded', function(e) {
      if (e.detail && e.detail.name === 'simple-navbar') init();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
