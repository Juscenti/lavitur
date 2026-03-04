document.addEventListener('DOMContentLoaded', () => {
    const slidesContainer = document.getElementById('tp-slides');
    let currentIndex = 0;
    let slideCount = 0;
  
    // Mock: fetch “top picks” based on localStorage or behavior.
    const topPicks = JSON.parse(localStorage.getItem('topPicks')) || [
      { img: 'images/slideshow/Menswear.png', title: 'Jacket Noir', price: '€320', link: 'shop.html?product=1' },
      { img: 'images/slideshow/Womenswear.png', title: 'Silk Blouse', price: '€180', link: 'shop.html?product=2' },
      { img: 'images/slideshow/Niche.png', title: 'Denim Classic', price: '€240', link: 'shop.html?product=3' }
    ];
  
    // Render Slides
    topPicks.forEach(item => {
      const slide = document.createElement('a');
      slide.href = item.link;
      slide.className = 'tp-slide';
      slide.innerHTML = `
        <img src="${item.img}" alt="${item.title}">
        <div class="info">
          <h4>${item.title}</h4>
          <p>${item.price}</p>
        </div>
      `;
      slidesContainer.appendChild(slide);
    });
  
    slideCount = topPicks.length;
  
    // Navigation (slide width 280px + gap 24px)
    const slideStep = 280 + 24;
    function showSlide(idx) {
      if (idx < 0) idx = slideCount - 1;
      if (idx >= slideCount) idx = 0;
      currentIndex = idx;
      slidesContainer.style.transform = `translateX(-${idx * slideStep}px)`;
    }
  
    document.querySelector('.top-picks .prev')
      .addEventListener('click', () => showSlide(currentIndex - 1));
    document.querySelector('.top-picks .next')
      .addEventListener('click', () => showSlide(currentIndex + 1));
  });
  