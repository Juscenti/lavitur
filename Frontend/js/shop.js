// Frontend/js/shop.js — uses REST API for products and categories
import { api } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("product-grid");
  const filters = Array.from(document.querySelectorAll(".category-filter"));

  let products = [];
  let categorySlugToId = new Map();

  function formatMoney(amount, currency = "JMD") {
    const n = Number(amount ?? 0);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
    } catch {
      return `${currency} ${n.toFixed(2)}`;
    }
  }

  function render() {
    const activeCats = filters.filter((f) => f.checked).map((f) => f.value);
    const toShow = activeCats.length
      ? products.filter((p) => activeCats.includes(p.category_slug))
      : products;

    grid.innerHTML = toShow
      .map(
        (p) => `
      <div class="product-card">
        <img loading="lazy" src="${p.image_url || "images/placeholder.jpg"}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <p>${formatMoney(p.price, "JMD")}</p>
        <div class="actions">
          <button class="add-cart" data-id="${p.id}">Add to Cart</button>
          <button class="add-wishlist" data-id="${p.id}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  async function loadCategories() {
    const data = await api.get("/categories");
    categorySlugToId.clear();
    for (const c of data || []) {
      const slug = (c.slug || c.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
      if (slug) categorySlugToId.set(slug, c.id);
    }
  }

  async function loadProducts() {
    const data = await api.get("/products");
    products = Array.isArray(data) ? data : [];
    render();
  }

  filters.forEach((f) => f.addEventListener("change", render));

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const id = btn?.dataset.id;
    if (!id) return;

    const product = products.find((p) => String(p.id) === String(id));
    if (!product) return;

    if (btn.classList.contains("add-cart")) {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((item) => String(item.id) === String(id));
      if (existing) existing.quantity++;
      else cart.push({ ...product, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart.");
    }

    if (btn.classList.contains("add-wishlist") || btn.closest(".add-wishlist")) {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (!wishlist.some((item) => String(item.id) === String(id))) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        alert("Added to wishlist.");
      }
    }
  });

  (async () => {
    try {
      await loadCategories();
      await loadProducts();
    } catch (err) {
      console.error("Shop load failed:", err);
      if (grid) grid.innerHTML = `<p style="padding:16px;">Failed to load products.</p>`;
    }
  })();
});
