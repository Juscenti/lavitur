/**
 * Contact page: form submit handler
 */
(function() {
  function init() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for your message! We\'ll get back to you soon.');
      this.reset();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
