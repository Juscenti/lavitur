/**
 * Shop page: products grid, sort/filter/search, load more, quick view, wishlist.
 * State persisted in URL params. Wishlist: localStorage (backend API can be wired later when available).
 */
import { api } from "./api.js";

const PAGE_SIZE = 12;
const NEW_DAYS = 30;
const LOW_STOCK_LIMITED = 5;

const grid = document.getElementById("product-grid");
const loadMoreWrap = document.getElementById("load-more-wrap");
const loadMoreBtn = document.getElementById("load-more-btn");
const shopEmpty = document.getElementById("shop-empty");
const shopError = document.getElementById("shop-error");
const retryBtn = document.getElementById("retry-btn");
const shopSearch = document.getElementById("shop-search");
const shopSort = document.getElementById("shop-sort");
const filtersSidebar = document.getElementById("filters-sidebar");
const filtersToggle = document.getElementById("filters-toggle");
const filtersClose = document.getElementById("filters-close");
const filtersBackdrop = document.getElementById("filters-backdrop");
const filterMainCatList = document.getElementById("filter-main-cat-list");
const filterSubCatList = document.getElementById("filter-sub-cat-list");
const filterSize = document.getElementById("filter-size");
const filterPriceMin = document.getElementById("filter-price-min");
const filterPriceMax = document.getElementById("filter-price-max");
const filterInStock = document.getElementById("filter-in-stock");
const clearFiltersBtn = document.getElementById("clear-filters");
const clearFiltersInline = document.getElementById("clear-filters-inline");
const quickViewOverlay = document.getElementById("quick-view-overlay");
const quickViewModal = document.getElementById("quick-view-modal");
const quickViewClose = document.getElementById("quick-view-close");
const quickViewImg = document.getElementById("quick-view-img");
const quickViewTitle = document.getElementById("quick-view-title");
const quickViewPrice = document.getElementById("quick-view-price");
const quickViewDesc = document.getElementById("quick-view-desc");
const quickViewPdp = document.getElementById("quick-view-pdp");
const quickViewWishlist = document.getElementById("quick-view-wishlist");

let allProducts = [];
let categories = [];
let displayedCount = 0;
let loading = false;
let loadError = false;
let quickViewProductId = null;

// ----- Analytics hooks (emit only; no real analytics yet) -----
function track(eventName, detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent("shop_analytics", { detail: { event: eventName, ...detail } }));
  } catch (_) {}
}

const slugNorm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
const MAIN_CAT_SLUGS = new Set(["menswear", "mens", "womenswear", "womens", "unisex"]);
function getMainCategories() {
  return (categories || []).filter((c) => MAIN_CAT_SLUGS.has(slugNorm(c.name)));
}
function getSubCategories() {
  const mains = getMainCategories();
  const mainIds = new Set(mains.map((c) => c.id));
  return (categories || []).filter((c) => !mainIds.has(c.id));
}

// ----- URL state -----
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  let mainCat = p.get("mainCat") || "";
  const subCatRaw = p.get("subCat") || p.get("subCats") || "";
  const subCats = subCatRaw ? subCatRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const legacyCategories = (p.get("categories") || "").split(",").filter(Boolean);
  if (legacyCategories.length && !mainCat && !subCats.length) {
    const first = legacyCategories[0];
    mainCat = MAIN_CAT_SLUGS.has(slugNorm(first)) ? first : "";
    if (!mainCat) subCats.push(first);
  }
  return {
    q: p.get("q") || "",
    sort: p.get("sort") || "newest",
    mainCat,
    subCats,
    size: p.get("size") || "",
    priceMin: p.get("priceMin") || "",
    priceMax: p.get("priceMax") || "",
    inStock: p.get("inStock") === "1",
    page: Math.max(1, parseInt(p.get("page") || "1", 10)),
  };
}

function setUrlParams(params) {
  const p = new URLSearchParams(window.location.search);
  if (params.q !== undefined) params.q ? p.set("q", params.q) : p.delete("q");
  if (params.sort !== undefined) params.sort && params.sort !== "newest" ? p.set("sort", params.sort) : p.delete("sort");
  if (params.mainCat !== undefined) params.mainCat ? p.set("mainCat", params.mainCat) : p.delete("mainCat");
  if (params.subCats !== undefined) {
    if (params.subCats.length) p.set("subCats", params.subCats.join(","));
    else p.delete("subCats");
  }
  if (params.size !== undefined) params.size ? p.set("size", params.size) : p.delete("size");
  if (params.priceMin !== undefined) params.priceMin ? p.set("priceMin", params.priceMin) : p.delete("priceMin");
  if (params.priceMax !== undefined) params.priceMax ? p.set("priceMax", params.priceMax) : p.delete("priceMax");
  if (params.inStock !== undefined) p.set("inStock", params.inStock ? "1" : "0");
  if (params.page !== undefined) p.set("page", String(params.page));
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", url);
}

// ----- Wishlist (localStorage; backend can be added when API exists) -----
const WISHLIST_KEY = "lavitur_wishlist";

function getWishlistIds() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}

function setWishlistIds(ids) {
  const arr = Array.from(ids);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(arr));
}

function isWishlisted(productId) {
  return getWishlistIds().has(String(productId));
}

function toggleWishlist(productId) {
  const ids = getWishlistIds();
  const sid = String(productId);
  if (ids.has(sid)) ids.delete(sid);
  else ids.add(sid);
  setWishlistIds(ids);
  track("wishlist_toggle", { product_id: productId, added: ids.has(sid) });
  return ids.has(sid);
}

// ----- Helpers -----
function formatMoney(amount, currency = "JMD") {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch (_) {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function isNew(product) {
  if (!product.created_at) return false;
  const d = new Date(product.created_at);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff <= NEW_DAYS;
}

function isSoldOut(product) {
  return Number(product.stock ?? 0) <= 0;
}

function isLimited(product) {
  const s = Number(product.stock ?? 0);
  return s > 0 && s <= LOW_STOCK_LIMITED;
}

function productMatchesSize(product, size) {
  if (!size) return true;
  const s = (product.size || product.sizes || "").toString().toUpperCase();
  if (!s) return true;
  if (Array.isArray(product.sizes)) return product.sizes.some((x) => String(x).toUpperCase() === size);
  return s === size.toUpperCase();
}

// ----- Filter + sort + search (client-side) -----
/** Product matches main category filter. Unisex appears in Menswear and Womenswear. */
function productMatchesMainCat(p, mainCatSlug) {
  if (!mainCatSlug) return true;
  const slugs = Array.isArray(p.category_slugs) ? p.category_slugs : (p.category_slug ? [p.category_slug] : []);
  const normSet = new Set(slugs.map((s) => slugNorm(s)));
  const n = slugNorm(mainCatSlug);
  if (n === "general" || n === "any") return true;
  if (n === "unisex") return normSet.has("unisex");
  if (n === "menswear" || n === "mens") return normSet.has("menswear") || normSet.has("mens") || normSet.has("unisex");
  if (n === "womenswear" || n === "womens") return normSet.has("womenswear") || normSet.has("womens") || normSet.has("unisex");
  return normSet.has(n);
}

function getFilteredAndSortedProducts() {
  const params = getUrlParams();
  let list = [...allProducts];

  if (params.q.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter((p) => {
      const names = Array.isArray(p.category_names) ? p.category_names : [p.category_name].filter(Boolean);
      const slugs = Array.isArray(p.category_slugs) ? p.category_slugs : [p.category_slug].filter(Boolean);
      return (
        (p.title || "").toLowerCase().includes(q) ||
        names.some((n) => (n || "").toLowerCase().includes(q)) ||
        slugs.some((s) => (s || "").toLowerCase().includes(q))
      );
    });
  }

  if (params.mainCat) {
    list = list.filter((p) => productMatchesMainCat(p, params.mainCat));
  }
  if (params.subCats && params.subCats.length > 0) {
    const subNormSet = new Set(params.subCats.map((s) => slugNorm(s)));
    list = list.filter((p) => {
      const slugs = Array.isArray(p.category_slugs) ? p.category_slugs : (p.category_slug ? [p.category_slug] : []);
      return slugs.some((s) => subNormSet.has(slugNorm(s)));
    });
  }

  if (params.size) {
    list = list.filter((p) => productMatchesSize(p, params.size));
  }

  const min = parseFloat(params.priceMin);
  const max = parseFloat(params.priceMax);
  if (!Number.isNaN(min)) list = list.filter((p) => Number(p.price) >= min);
  if (!Number.isNaN(max)) list = list.filter((p) => Number(p.price) <= max);

  if (params.inStock) {
    list = list.filter((p) => Number(p.stock ?? 0) > 0);
  }

  switch (params.sort) {
    case "price_asc":
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price_desc":
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    default:
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  return list;
}

// ----- Render -----
function renderSkeletons(count) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "product-card skeleton";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <div class="card-image-wrap"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" alt="" /></div>
      <h3 class="card-title">&nbsp;</h3>
      <p class="card-price">&nbsp;</p>
    `;
    frag.appendChild(card);
  }
  grid.innerHTML = "";
  grid.appendChild(frag);
}

function getPdpUrl(id) {
  if (id == null || id === "") return "shop.html";
  const pathname = typeof window !== "undefined" ? window.location.pathname || "" : "";
  const underFrontend = /\/Frontend(\/|$)/i.test(pathname);
  const basePath = underFrontend ? "/Frontend/" : "./";
  return basePath + "product.html#" + encodeURIComponent(String(id));
}

function renderProductCard(p) {
  const wished = isWishlisted(p.id);
  const badges = [];
  if (isNew(p)) badges.push({ text: "New", class: "badge-new" });
  if (isSoldOut(p)) badges.push({ text: "Sold out", class: "badge-soldout" });
  else if (isLimited(p)) badges.push({ text: "Limited", class: "badge-limited" });

  const badgeHtml =
    badges.length > 0
      ? `<div class="product-badges">${badges.map((b) => `<span class="product-badge ${b.class}">${b.text}</span>`).join("")}</div>`
      : "";

  const card = document.createElement("div");
  card.className = "product-card";
  card.setAttribute("role", "listitem");
  card.dataset.productId = p.id;
  card.innerHTML = `
    <a href="${getPdpUrl(p.id)}" class="product-card-link" data-pdp-link>
      <div class="card-image-wrap">
        ${badgeHtml}
        <img loading="lazy" src="${p.image_url || "images/placeholder.jpg"}" alt="${(p.title || "").replace(/"/g, "&quot;")}" />
      </div>
      <h3 class="card-title">${(p.title || "Untitled").replace(/</g, "&lt;")}</h3>
      <p class="card-price">${formatMoney(p.price, "JMD")}</p>
      <div class="card-actions">
        <button type="button" class="quick-view-btn" data-id="${p.id}" aria-label="Quick view">${"<i class=\"fas fa-eye\"></i>"}</button>
        <button type="button" class="wishlist-btn ${wished ? "is-wishlisted" : ""}" data-id="${p.id}" aria-label="${wished ? "Remove from wishlist" : "Add to wishlist"}">
          <i class="${wished ? "fas" : "far"} fa-heart"></i>
        </button>
      </div>
    </a>
  `;

  const link = card.querySelector("[data-pdp-link]");
  const qvBtn = card.querySelector(".quick-view-btn");
  const wlBtn = card.querySelector(".wishlist-btn");

  link.addEventListener("click", (e) => {
    if (e.target.closest(".card-actions")) {
      e.preventDefault();
      return;
    }
    track("product_card_click", { product_id: p.id });
  });

  qvBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(p);
    track("quick_view_open", { product_id: p.id });
  });

  wlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowWished = toggleWishlist(p.id);
    wlBtn.classList.toggle("is-wishlisted", nowWished);
    wlBtn.querySelector("i").className = nowWished ? "fas fa-heart" : "far fa-heart";
    wlBtn.setAttribute("aria-label", nowWished ? "Remove from wishlist" : "Add to wishlist");
  });

  return card;
}

function renderGrid(products, append = false) {
  const params = getUrlParams();
  const page = params.page;
  const start = append ? displayedCount : 0;
  const end = append ? Math.min(displayedCount + PAGE_SIZE, products.length) : Math.min(page * PAGE_SIZE, products.length);
  const slice = products.slice(start, end);

  if (!append) {
    grid.innerHTML = "";
  }

  slice.forEach((p) => {
    grid.appendChild(renderProductCard(p));
  });

  displayedCount = end;
  const hasMore = end < products.length;

  if (append) {
    setUrlParams({ ...getUrlParams(), page: page + 1 });
  }

  loadMoreWrap.hidden = !hasMore;
  loadMoreBtn.disabled = !hasMore;
  shopEmpty.hidden = true;

  if (products.length === 0) {
    shopEmpty.hidden = false;
    loadMoreWrap.hidden = true;
  }
}

function showError() {
  grid.innerHTML = "";
  loadMoreWrap.hidden = true;
  shopEmpty.hidden = true;
  shopError.hidden = false;
}

function hideError() {
  shopError.hidden = true;
}

// ----- Quick View -----
function openQuickView(product) {
  quickViewProductId = product.id;
  quickViewImg.src = product.image_url || "images/placeholder.jpg";
  quickViewImg.alt = product.title || "";
  quickViewTitle.textContent = product.title || "Untitled";
  quickViewPrice.textContent = formatMoney(product.price, "JMD");
  quickViewDesc.textContent = (product.description || "").trim() || "No description.";
  quickViewPdp.href = getPdpUrl(product.id);

  const wished = isWishlisted(product.id);
  quickViewWishlist.classList.toggle("is-wishlisted", wished);
  quickViewWishlist.querySelector("i").className = wished ? "fas fa-heart" : "far fa-heart";

  quickViewOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  quickViewClose.focus();
}

function closeQuickView() {
  quickViewOverlay.hidden = true;
  document.body.style.overflow = "";
  quickViewProductId = null;
}

if (quickViewClose) {
  quickViewClose.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeQuickView();
  });
}
if (quickViewOverlay) {
  quickViewOverlay.addEventListener("click", (e) => {
    if (e.target === quickViewOverlay) closeQuickView();
  });
}

quickViewWishlist.addEventListener("click", () => {
  if (!quickViewProductId) return;
  const product = allProducts.find((p) => String(p.id) === String(quickViewProductId));
  if (!product) return;
  const nowWished = toggleWishlist(product.id);
  quickViewWishlist.classList.toggle("is-wishlisted", nowWished);
  quickViewWishlist.querySelector("i").className = nowWished ? "fas fa-heart" : "far fa-heart";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !quickViewOverlay.hidden) closeQuickView();
});

// ----- Fetch -----
async function loadCategories() {
  const data = await api.get("/categories");
  categories = Array.isArray(data) ? data : [];
}

async function loadProducts() {
  if (loading) return;
  loading = true;
  loadError = false;
  hideError();
  renderSkeletons(PAGE_SIZE);
  try {
    const [prods] = await Promise.all([api.get("/products"), loadCategories()]);
    allProducts = Array.isArray(prods) ? prods : [];
    loading = false;
    syncControlsFromUrl();
    applyStateAndRender(false);
  } catch (err) {
    console.error("Shop load failed:", err);
    loading = false;
    loadError = true;
    showError();
  }
}

function applyStateAndRender(append) {
  if (loadError) return;
  const params = getUrlParams();
  if (!append) {
    displayedCount = 0;
  }
  const filtered = getFilteredAndSortedProducts();
  if (filtered.length === 0) {
    grid.innerHTML = "";
    shopEmpty.hidden = false;
    loadMoreWrap.hidden = true;
    return;
  }
  renderGrid(filtered, append);
}

function escapeAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function syncControlsFromUrl() {
  const params = getUrlParams();
  if (shopSearch) shopSearch.value = params.q;
  if (shopSort) shopSort.value = params.sort;
  if (filterSize) filterSize.value = params.size;
  if (filterPriceMin) filterPriceMin.value = params.priceMin;
  if (filterPriceMax) filterPriceMax.value = params.priceMax;
  if (filterInStock) filterInStock.checked = params.inStock;

  if (filterMainCatList && categories.length) {
    const mains = getMainCategories();
    const mainSlug = slugNorm(params.mainCat);
    filterMainCatList.innerHTML =
      '<label class="filter-checkbox-label"><input type="radio" name="filter-main-cat" value="" ' + (!params.mainCat ? " checked" : "") + ' /><span>Any</span></label>' +
      mains
        .map((c) => {
          const slug = slugNorm(c.slug || c.name);
          const displayName = c.name || slug;
          const checked = params.mainCat && mainSlug === slug ? " checked" : "";
          return `<label class="filter-checkbox-label"><input type="radio" name="filter-main-cat" value="${escapeAttr(slug)}"${checked} /><span>${escapeAttr(displayName)}</span></label>`;
        })
        .join("");
  }
  if (filterSubCatList && categories.length) {
    const subs = getSubCategories();
    const selectedSubSlugs = new Set((params.subCats || []).map((s) => slugNorm(s)));
    filterSubCatList.innerHTML =
      subs.length > 0
        ? subs
            .map((c) => {
              const slug = slugNorm(c.slug || c.name);
              const displayName = c.name || slug;
              const checked = selectedSubSlugs.has(slug) ? " checked" : "";
              return `<label class="filter-checkbox-label"><input type="checkbox" class="filter-sub-cb" data-slug="${escapeAttr(slug)}"${checked} /><span>${escapeAttr(displayName)}</span></label>`;
            })
            .join("")
        : "<p class=\"filter-hint\">No sub-categories</p>";
  }
}

function pushState(updates) {
  const prev = getUrlParams();
  const next = { ...prev, ...updates };
  if (
    updates.page === undefined &&
    (updates.q !== undefined ||
      updates.sort !== undefined ||
      updates.mainCat !== undefined ||
      updates.subCats !== undefined ||
      updates.size !== undefined ||
      updates.priceMin !== undefined ||
      updates.priceMax !== undefined ||
      updates.inStock !== undefined)
  ) {
    next.page = 1;
  }
  setUrlParams(next);
  syncControlsFromUrl();
  displayedCount = 0;
  applyStateAndRender(false);
}

// ----- Filter sidebar: fixed; on mobile = drawer. Collapsible sections (Main cat, Sub-Cats, Size) -----
function openFiltersDrawer() {
  if (filtersSidebar) filtersSidebar.classList.add("is-open");
  if (filtersBackdrop) {
    filtersBackdrop.classList.add("is-open");
    filtersBackdrop.setAttribute("aria-hidden", "false");
  }
}

function closeFiltersDrawer() {
  if (filtersSidebar) filtersSidebar.classList.remove("is-open");
  if (filtersBackdrop) {
    filtersBackdrop.classList.remove("is-open");
    filtersBackdrop.setAttribute("aria-hidden", "true");
  }
}

function initFilterCollapsibles() {
  const triggers = document.querySelectorAll(".filter-collapse-trigger");
  const STORAGE_KEY = "lavitur_shop_filter_collapse";
  function getStored() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }
  function setStored(key, closed) {
    const o = getStored();
    o[key] = closed;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }
  triggers.forEach((btn) => {
    const collapse = btn.closest(".filter-collapse");
    const key = collapse?.dataset.collapse || "section";
    const content = document.getElementById(btn.getAttribute("aria-controls") || "");
    if (!collapse || !content) return;
    const stored = getStored();
    const initiallyClosed = stored[key] === true;
    if (initiallyClosed) {
      collapse.classList.add("is-closed");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", () => {
      const isClosed = collapse.classList.toggle("is-closed");
      btn.setAttribute("aria-expanded", isClosed ? "false" : "true");
      setStored(key, isClosed);
    });
  });
}

function clearAllFilters() {
  setUrlParams({
    q: getUrlParams().q,
    sort: getUrlParams().sort,
    mainCat: "",
    subCats: [],
    size: "",
    priceMin: "",
    priceMax: "",
    inStock: false,
    page: 1,
  });
  syncControlsFromUrl();
  displayedCount = 0;
  applyStateAndRender(false);
  track("filter_change", { cleared: true });
  closeFiltersDrawer();
}

// ----- Debounce -----
function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ----- Event bindings -----
if (shopSearch) {
  shopSearch.addEventListener(
    "input",
    debounce(() => {
      const q = shopSearch.value.trim();
      setUrlParams({ ...getUrlParams(), q, page: 1 });
      syncControlsFromUrl();
      displayedCount = 0;
      applyStateAndRender(false);
      track("search_used", { q });
    }, 300)
  );
}

if (shopSort) {
  shopSort.addEventListener("change", () => {
    const sort = shopSort.value;
    setUrlParams({ ...getUrlParams(), sort, page: 1 });
    syncControlsFromUrl();
    displayedCount = 0;
    applyStateAndRender(false);
    track("sort_change", { sort });
  });
}

if (filtersToggle) filtersToggle.addEventListener("click", openFiltersDrawer);
if (filtersClose) filtersClose.addEventListener("click", closeFiltersDrawer);
if (filtersBackdrop) filtersBackdrop.addEventListener("click", closeFiltersDrawer);

if (filterMainCatList) {
  filterMainCatList.addEventListener("change", (e) => {
    const radio = e.target.closest('input[name="filter-main-cat"]');
    if (!radio) return;
    const value = radio.value || "";
    pushState({ mainCat: value });
    track("filter_change", { mainCat: value });
  });
}
if (filterSubCatList) {
  filterSubCatList.addEventListener("change", (e) => {
    if (!e.target.classList.contains("filter-sub-cb")) return;
    const checked = Array.from(filterSubCatList.querySelectorAll(".filter-sub-cb:checked")).map((el) => el.dataset.slug || el.value || "").filter(Boolean);
    pushState({ subCats: checked });
    track("filter_change", { subCats: checked });
  });
}

if (filterSize) {
  filterSize.addEventListener("change", () => {
    setUrlParams({ ...getUrlParams(), size: filterSize.value, page: 1 });
    displayedCount = 0;
    applyStateAndRender(false);
    track("filter_change", { size: filterSize.value });
  });
}

if (filterPriceMin) {
  filterPriceMin.addEventListener("change", () => {
    setUrlParams({ ...getUrlParams(), priceMin: filterPriceMin.value, page: 1 });
    displayedCount = 0;
    applyStateAndRender(false);
    track("filter_change", { priceMin: filterPriceMin.value });
  });
}

if (filterPriceMax) {
  filterPriceMax.addEventListener("change", () => {
    setUrlParams({ ...getUrlParams(), priceMax: filterPriceMax.value, page: 1 });
    displayedCount = 0;
    applyStateAndRender(false);
    track("filter_change", { priceMax: filterPriceMax.value });
  });
}

if (filterInStock) {
  filterInStock.addEventListener("change", () => {
    setUrlParams({ ...getUrlParams(), inStock: filterInStock.checked, page: 1 });
    displayedCount = 0;
    applyStateAndRender(false);
    track("filter_change", { inStock: filterInStock.checked });
  });
}

if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearAllFilters);
if (clearFiltersInline) clearFiltersInline.addEventListener("click", clearAllFilters);

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    loadMoreWrap.classList.add("loading");
    loadMoreBtn.disabled = true;
    track("load_more_clicked", {});
    applyStateAndRender(true);
    loadMoreWrap.classList.remove("loading");
  });
}

if (retryBtn) retryBtn.addEventListener("click", () => loadProducts());

// ----- Init -----
document.addEventListener("DOMContentLoaded", () => {
  if (quickViewOverlay) quickViewOverlay.hidden = true;
  initFilterCollapsibles();
  syncControlsFromUrl();
  loadProducts();
});
