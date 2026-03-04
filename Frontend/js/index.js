/**
 * Index page: hero slideshow and newsletter form
 */
(function() {
  function initSlideshow() {
    var slides = document.querySelector('.index-page .slides');
    if (!slides) return;
    var totalSlides = document.querySelectorAll('.index-page .slide').length;
    var currentSlide = 0;

    function showSlide(index) {
      if (index >= totalSlides) currentSlide = 0;
      else if (index < 0) currentSlide = totalSlides - 1;
      else currentSlide = index;
      slides.style.transform = 'translateX(-' + currentSlide * 100 + '%)';
    }

    var nextBtn = document.querySelector('.index-page .hero .next');
    var prevBtn = document.querySelector('.index-page .hero .prev');
    if (nextBtn) nextBtn.addEventListener('click', function() { showSlide(currentSlide + 1); });
    if (prevBtn) prevBtn.addEventListener('click', function() { showSlide(currentSlide - 1); });

    var interval = setInterval(function() { showSlide(currentSlide + 1); }, 5500);
    slides.addEventListener('mouseenter', function() { clearInterval(interval); });
    slides.addEventListener('mouseleave', function() {
      interval = setInterval(function() { showSlide(currentSlide + 1); }, 5500);
    });
  }

  function initNewsletter() {
    var form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = form.querySelector('input[name="email"]').value;
      if (email) alert('Thank you for subscribing. Welcome to Lavitúr.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initSlideshow();
      initNewsletter();
    });
  } else {
    initSlideshow();
    initNewsletter();
  }
})();
