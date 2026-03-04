/**
 * Base path fix for Frontend folder.
 * Run first in <head>: ensures <base href="/Frontend/">.
 * FRONTEND_HOME is always the base path with trailing slash (e.g. /Frontend/) so that
 * Home links never go to /Frontend (no slash), where script/css would 404 before any JS runs.
 */
(function() {
  var p = window.location.pathname;
  if (p.startsWith('/Frontend') || p.startsWith('/frontend')) {
    var base = document.createElement('base');
    base.href = '/Frontend/';
    document.head.insertBefore(base, document.head.firstChild);
    var basePath = p.substring(0, p.lastIndexOf('/') + 1);
    if (basePath && !basePath.endsWith('/')) basePath += '/';
    window.FRONTEND_HOME = basePath || '/Frontend/';
  }
})();
