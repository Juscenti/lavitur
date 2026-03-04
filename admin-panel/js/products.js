// admin-panel/js/products.js — uses REST API
import { api } from "./api.js";
import { requireStaff } from "./adminGuard.js";
import { uploadProductMedia } from "./productMedia.js";
import { renderMediaGrid, bindMediaInputForExistingProduct, renderLocalSelectedMedia } from "./productMediaUI.js";

const viewerSection = document.getElementById("viewerModeSection");
const editorialSection = document.getElementById("editorialModeSection");
const modeSwitch = document.getElementById("modeSwitch");
const viewerTableBody = document.getElementById("viewerTableBody");
const categoryContainer = document.getElementById("categoryContainer");
const addGeneralBtn = document.getElementById("addGeneralProductBtn");

let myProfile = null;
let productData = [];
let categories = [];

const MAIN_CATEGORY_NAMES = ["Men's Wear", "Women's Wear", "Unisex"];
const MAIN_CATEGORY_NORMS = new Set(
  ["men's wear", "mens wear", "menswear", "women's wear", "womens wear", "womenswear", "unisex"].map((s) =>
    s.replace(/\s+/g, " ").trim()
  )
);
const nameNorm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/['']/g, "'").trim();

/** Display labels for the big category boxes (General is virtual = all products) */
const MAIN_CAT_BOX_LABELS = {
  general: "General",
  "men's wear": "Menswear",
  "women's wear": "Womenswear",
  unisex: "Unisex",
};
function getMainCatBoxLabel(name) {
  const n = nameNorm(name || "general");
  return MAIN_CAT_BOX_LABELS[n] || name || "General";
}

/** Whether product belongs in a main-category view. Unisex appears in Menswear and Womenswear too. */
function productInMainView(prod, mainKey) {
  const cats = Array.isArray(prod.categories) ? prod.categories : [prod.category].filter(Boolean);
  const norms = new Set(cats.map((c) => nameNorm(c)));
  if (mainKey === "general") return true;
  if (mainKey === "unisex") return norms.has("unisex");
  if (mainKey === "menswear" || mainKey === "men's wear")
    return norms.has("men's wear") || norms.has("menswear") || norms.has("unisex");
  if (mainKey === "womenswear" || mainKey === "women's wear")
    return norms.has("women's wear") || norms.has("womenswear") || norms.has("unisex");
  return norms.has(nameNorm(mainKey));
}

function getMainCategories() {
  return (categories || []).filter((c) => MAIN_CATEGORY_NORMS.has(nameNorm(c.name)));
}
function getSubCategories() {
  const mains = getMainCategories();
  const mainIds = new Set(mains.map((c) => c.id));
  return (categories || []).filter((c) => !mainIds.has(c.id));
}

/** Role gating: only Senior Employee+ can use editorial mode */
function canUseEditorial(role) {
  // your roles: employee, senior_employee, representative, admin
  return ["senior employee", "representative", "admin"].includes(role);
}

/** API returns { id, name, description, price, stock, status, published, category, categories, thumbUrl } */
function toUiProduct(row) {
  const cats = Array.isArray(row.categories) ? row.categories.filter((c) => c && c !== "Unassigned") : [];
  const catDisplay = cats.length ? cats.join(", ") : (row.category || "Unassigned");
  return {
    id: row.id,
    name: row.name ?? row.title,
    description: row.description ?? "",
    price: row.price,
    stock: row.stock ?? "",
    status: row.status,
    published: row.published ?? row.status === "published",
    category: catDisplay,
    categories: cats.length ? cats : [],
    thumbUrl: row.thumbUrl ?? null,
  };
}


/** Money formatting */
function formatMoney(n) {
  const v = Number(n || 0);
  return `JMD ${v.toFixed(2)}`;
}

/** Populate main + sub category fields in the product form modal */
function fillCategoryFields(selectedNames = []) {
  const mainSel = document.getElementById("productMainCategory");
  const subSel = document.getElementById("productSubCategories");
  if (!mainSel || !subSel) return;

  const arr = Array.isArray(selectedNames) ? selectedNames : (selectedNames ? [selectedNames] : []);
  const selectedSet = new Set(arr);

  const mains = getMainCategories();
  const subs = getSubCategories();

  mainSel.innerHTML =
    '<option value="">— Select —</option>' +
    (mains.length
      ? mains.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")
      : '<option value="" disabled>Add Men\'s Wear, Women\'s Wear, Unisex in Categories first</option>');

  subSel.innerHTML = subs.map((c) => {
    const name = c.name || "";
    const sel = selectedSet.has(name) ? " selected" : "";
    return `<option value="${escapeHtml(name)}"${sel}>${escapeHtml(name)}</option>`;
  }).join("");

  const mainFromSelection = arr.find((n) => mains.some((m) => nameNorm(m.name) === nameNorm(n)));
  if (mainFromSelection) mainSel.value = mains.find((m) => nameNorm(m.name) === nameNorm(mainFromSelection))?.name || mainFromSelection;
}

async function createProduct({ title, description, price, stock, categoryNames }) {
  const res = await api.post("/admin/products", {
    title,
    description: description || null,
    price,
    stock,
    categoryNames: Array.isArray(categoryNames) ? categoryNames : [],
  });
  return res.id;
}

async function updateProduct(productId, { title, description, price, stock, categoryNames }) {
  await api.patch(`/admin/products/${productId}`, {
    title,
    description: description || null,
    price,
    stock,
    categoryNames: Array.isArray(categoryNames) ? categoryNames : [],
  });
}

async function loadProducts() {
  try {
  const [productsRes, catRes] = await Promise.all([
    api.get("/admin/products"),
    api.get("/categories").catch(() => []),
  ]);
  if (!Array.isArray(productsRes)) {
    console.error("Invalid products response");
    alert("Failed to load products");
    return;
  }

  // Fetch categories
  categories = Array.isArray(catRes) ? catRes : [];
  productData = productsRes.map((r) => toUiProduct(r));
  populateViewerFilterCategory();
  renderViewerTable(getViewerFilteredProducts());
  renderEditorialView(productData);
  } catch (err) {
    console.error(err);
    alert("Failed to load products");
  }
}

/** Viewer mode: get current filter values and return filtered product list */
function getViewerFilteredProducts() {
  const statusEl = document.getElementById("viewerFilterStatus");
  const categoryEl = document.getElementById("viewerFilterCategory");
  const status = statusEl?.value || "";
  const category = categoryEl?.value || "";
  let list = [...(productData || [])];
  if (status === "published") list = list.filter((p) => p.published);
  if (status === "unpublished") list = list.filter((p) => !p.published);
  if (category) {
    list = list.filter((p) => {
      const cats = Array.isArray(p.categories) ? p.categories : [p.category].filter(Boolean);
      return cats.some((c) => String(c).trim() === category);
    });
  }
  return list;
}

/** Populate category dropdown in viewer filters from current product data */
function populateViewerFilterCategory() {
  const sel = document.getElementById("viewerFilterCategory");
  if (!sel) return;
  const chosen = sel.value || "";
  const allCats = new Set();
  (productData || []).forEach((p) => {
    const cats = Array.isArray(p.categories) ? p.categories : [p.category].filter(Boolean);
    cats.forEach((c) => c && c !== "Unassigned" && allCats.add(c));
  });
  const sorted = [...allCats].sort((a, b) => String(a).localeCompare(b));
  sel.innerHTML = '<option value="">All</option>' + sorted.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (chosen && sorted.includes(chosen)) sel.value = chosen;
}

/** Viewer mode table (kept exactly like your old behavior) */
function renderViewerTable(products) {
  if (!viewerTableBody) return;

  viewerTableBody.innerHTML = "";
  products.forEach((prod) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(prod.name)}</td>
      <td>${formatMoney(prod.price)}</td>
      <td>${escapeHtml(String(prod.stock ?? ""))}</td>
      <td>${prod.published ? "Published" : "Unpublished"}</td>
      <td>${escapeHtml(prod.category)}</td>
      <td><button data-action="edit" data-id="${prod.id}">Edit</button></td>
    `;
    viewerTableBody.appendChild(row);
  });
}

/** Editorial mode category blocks (kept like your old grouping UI) */
// ✅ Add this helper somewhere ABOVE renderEditorialView (top-level in the same file)
function statusBadgeClass(status) {
  switch (status) {
    case "published":
      return "badge--live";
    case "pending":
      return "badge--pending";
    case "draft":
      return "badge--draft";
    case "archived":
      return "badge--archived";
    default:
      return "badge--draft";
  }
}

/**
 * Buttons for status flow: draft/pending → Publish → published (Live) → Archive → archived → Restore to pending.
 * - draft: Submit (→ pending), Publish (→ published)
 * - pending: Publish (→ published)
 * - published: Archive (→ archived)
 * - archived: Restore to pending (→ pending)
 */
function getStatusActionButtons(id, status) {
  const s = (status || "draft").toLowerCase();
  const idAttr = `data-id="${id}"`;
  const actionAttr = (statusValue) => `data-status-action="${statusValue}"`;
  const btn = (label, statusValue, primary = false) =>
    `<button class="pbtn2 ${primary ? "pbtn2--primary" : "pbtn2--ghost"}" ${idAttr} ${actionAttr(statusValue)}>${escapeHtml(label)}</button>`;

  if (s === "published") {
    return btn("Archive", "archived", true);
  }
  if (s === "archived") {
    return btn("Restore to pending", "pending", true);
  }
  if (s === "pending") {
    return btn("Publish", "published", true);
  }
  // draft (or unknown)
  return btn("Submit", "pending") + "\n                  " + btn("Publish", "published", true);
}

/** Build HTML for one product card (editorial grid) */
function editorialProductCardHtml(p) {
  const status = (p.status || "draft").toLowerCase();
  const statusText = status === "published" ? "Live" : status === "pending" ? "Pending" : status === "archived" ? "Archived" : "Draft";
  const badgeClass = statusBadgeClass(p.status);
  const actionButtons = getStatusActionButtons(p.id, status);
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="pcard-top">
        <div class="pcard-thumb">
          ${p.thumbUrl ? `<img src="${p.thumbUrl}" alt="${escapeHtml(p.name)}" />` : `<div class="pcard-thumb--empty">No Image</div>`}
          <div class="pcard-badge ${badgeClass}">${escapeHtml(statusText)}</div>
        </div>
        <div class="pcard-meta">
          <div class="pcard-title">${escapeHtml(p.name)}</div>
          <div class="pcard-price">${formatMoney(p.price)}</div>
          <div class="pcard-sub">${escapeHtml(String(p.stock || "—"))} in stock</div>
        </div>
      </div>
      <div class="pcard-actions">
        ${actionButtons}
        <button class="pbtn2 pbtn2--ghost editBtn" data-id="${p.id}">Edit</button>
      </div>
    </div>
  `;
}

/** Editorial view: large category boxes + Sub-Cats; click opens filtered product list. Unisex in Menswear/Womenswear. */
function renderEditorialView(products) {
  if (!categoryContainer) return;

  const mains = getMainCategories();
  const subs = getSubCategories();

  // Default: show boxes. When filter is set, show filtered grid.
  let editorialFilter = null; // { type: 'main', value: string } | { type: 'sub', value: string } | null

  function getFilteredProducts() {
    if (!editorialFilter) return [];
    if (editorialFilter.type === "main") {
      if (editorialFilter.value === "general") return products;
      return products.filter((p) => productInMainView(p, editorialFilter.value));
    }
    if (editorialFilter.type === "sub") {
      return products.filter((p) => {
        const cats = Array.isArray(p.categories) ? p.categories : [];
        return cats.some((c) => nameNorm(c) === nameNorm(editorialFilter.value));
      });
    }
    return [];
  }

  function renderFilteredView() {
    const filtered = getFilteredProducts();
    const title =
      editorialFilter.type === "main"
        ? getMainCatBoxLabel(editorialFilter.value)
        : escapeHtml(editorialFilter.value);
    const addCategory = editorialFilter.type === "sub" ? editorialFilter.value : editorialFilter.value === "general" ? null : (mains.find((m) => nameNorm(m.name) === nameNorm(editorialFilter.value))?.name ?? editorialFilter.value);

    categoryContainer.innerHTML = `
      <div class="editorial-filtered-header">
        <h3>${title}</h3>
        <div style="display:flex;align-items:center;gap:12px;">
          <button type="button" class="editorial-back-to-cats" id="editorialBackToCats">← Back to categories</button>
          <button class="addInCategoryBtn" data-add-category="${addCategory ? escapeHtml(addCategory) : ""}">+ Add Product</button>
        </div>
      </div>
      <div id="editorialFilteredGrid" class="product-grid">
        ${filtered.map((p) => editorialProductCardHtml(p)).join("")}
      </div>
    `;

    document.getElementById("editorialBackToCats")?.addEventListener("click", () => {
      editorialFilter = null;
      renderBoxes();
    });
    const addBtn = categoryContainer.querySelector(".addInCategoryBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const cat = addBtn.dataset.addCategory || null;
        openProductForm(cat, null);
      });
    }
  }

  function renderBoxes() {
    categoryContainer.innerHTML = `
      <div class="editorial-boxes-wrap">
        <div class="editorial-main-cats" id="editorialMainCats">
          <div class="editorial-cat-box" data-main="general" role="button" tabindex="0">
            <span class="editorial-cat-box-label">General</span>
          </div>
          ${mains
            .map(
              (c) =>
                `<div class="editorial-cat-box" data-main="${escapeHtml(c.name)}" role="button" tabindex="0">
                  <span class="editorial-cat-box-label">${escapeHtml(getMainCatBoxLabel(c.name))}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="editorial-subcats-row">
          <span class="editorial-subcats-title">Sub-Cats</span>
          <div class="editorial-subcats-inner" id="editorialSubcatsInner">
            ${subs.length ? subs.map((s) => `<button type="button" class="editorial-subcat-chip" data-sub="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`).join("") : "<span style='font-size:13px;color:var(--muted);'>No sub-categories</span>"}
          </div>
        </div>
      </div>
    `;

    categoryContainer.querySelectorAll(".editorial-cat-box").forEach((el) => {
      el.addEventListener("click", () => {
        editorialFilter = { type: "main", value: el.dataset.main || "general" };
        renderFilteredView();
      });
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          el.click();
        }
      });
    });
    categoryContainer.querySelectorAll(".editorial-subcat-chip").forEach((el) => {
      el.addEventListener("click", () => {
        editorialFilter = { type: "sub", value: el.dataset.sub || "" };
        renderFilteredView();
      });
    });
  }

  renderBoxes();
}


/** Status update via API. Returns true on success. */
async function updateStatus(id, status) {
  try {
    await api.patch(`/admin/products/${id}/status`, { status });
    return true;
  } catch (err) {
    console.error("updateStatus:", err);
    alert(err?.data?.error || err?.message || "Failed to update product status.");
    return false;
  }
}

/**
 * Product form modal wiring
 * Requires modal HTML elements:
 * - #productFormModal
 * - #productForm
 * - #productFormTitle
 * - #productCategorySelect
 * - #cancelProductFormBtn
 *
 * ✅ Media elements expected:
 * - #productMediaInput
 * - #productMediaGrid
 */
async function openProductForm(categoryName, productId) {
  const modal = document.getElementById("productFormModal");
  const form = document.getElementById("productForm");
  const titleEl = document.getElementById("productFormTitle");
  const cancelBtn = document.getElementById("cancelProductFormBtn");

  const mediaInput = document.getElementById("productMediaInput");

  if (!modal || !form || !titleEl || !cancelBtn) {
    console.warn("Product form modal elements missing. Add the modal HTML to products page.");
    return;
  }

  const close = () => modal.classList.add("hidden");

  // Close when clicking overlay or bottom cancel
const overlay = document.getElementById("productModalOverlay");
const bottomCancel = document.getElementById("cancelProductFormBtnBottom");

if (overlay) overlay.onclick = close;
if (bottomCancel) bottomCancel.onclick = close;

  // Reset and default values
  form.reset();
  fillCategoryFields(categoryName ? [categoryName] : []);

  if (!productId) {
    // CREATE MODE
    titleEl.textContent = "Add Product";

    // ✅ Media: show message until saved; clear input
    await renderMediaGrid(null);
    if (mediaInput) mediaInput.value = "";
    if (mediaInput) {
  mediaInput.onchange = () => {
    try {
      const files = [...(mediaInput.files || [])];
      renderLocalSelectedMedia(files);
    } catch (e) {
      console.error("Media preview failed:", e);
    }
  };
  
}



    modal.classList.remove("hidden");
    cancelBtn.onclick = close;

    form.onsubmit = async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const mainCat = document.getElementById("productMainCategory")?.value || "";
      const subSel = document.getElementById("productSubCategories");
      const subCats = subSel ? Array.from(subSel.selectedOptions).map((o) => o.value).filter(Boolean) : [];
      const categoryNames = [mainCat, ...subCats].filter(Boolean);
      const payload = {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        price: Number(fd.get("price")),
        stock: Number(fd.get("stock")),
        categoryNames,
      };

      if (!payload.title) {
        alert("Name is required.");
        return;
      }
      if (!mainCat) {
        alert("Please select a main category (Men's Wear, Women's Wear, or Unisex).");
        return;
      }
      if (!Number.isFinite(payload.price) || payload.price < 0) {
        alert("Price must be 0 or greater.");
        return;
      }
      if (!Number.isFinite(payload.stock) || payload.stock < 0) {
        alert("Stock must be 0 or greater.");
        return;
      }

      try {
        const newId = await createProduct(payload);

        // ✅ Media: upload selected files after product exists
        if (mediaInput && mediaInput.files && mediaInput.files.length) {
          const files = [...mediaInput.files];
          await uploadProductMedia(newId, files, { makeFirstImagePrimary: true });
          mediaInput.value = "";
        }

        close();
        await loadProducts();
      } catch (err) {
        console.error(err);
        alert(err.message || "Failed to save product.");
      }
    };

    return;
  }

  // EDIT MODE
  const existing = productData.find((p) => p.id === productId);
  titleEl.textContent = existing ? `Edit Product: ${existing.name}` : "Edit Product";

  // Prefill form from existing
  if (existing) {
    form.elements.title.value = existing.name ?? "";
    form.elements.description.value = existing.description ?? "";
    form.elements.price.value = Number(existing.price ?? 0);
    form.elements.stock.value = Number(existing.stock ?? 0);
    fillCategoryFields(existing.categories || []);
  }

  modal.classList.remove("hidden");
  cancelBtn.onclick = close;

  // ✅ Media: load + bind upload input for existing product
  await renderMediaGrid(productId);
  bindMediaInputForExistingProduct(productId);

  form.onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const mainCat = document.getElementById("productMainCategory")?.value || "";
    const subSel = document.getElementById("productSubCategories");
    const subCats = subSel ? Array.from(subSel.selectedOptions).map((o) => o.value).filter(Boolean) : [];
    const categoryNames = [mainCat, ...subCats].filter(Boolean);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      price: Number(fd.get("price")),
      stock: Number(fd.get("stock")),
      categoryNames,
    };

    if (!payload.title) {
      alert("Name is required.");
      return;
    }
    if (!mainCat) {
      alert("Please select a main category (Men's Wear, Women's Wear, or Unisex).");
      return;
    }

    try {
      await updateProduct(productId, payload);
      close();
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update product.");
    }
  };
}

/** Viewer mode: filter dropdowns and clear button */
function bindViewerFilters() {
  const statusEl = document.getElementById("viewerFilterStatus");
  const categoryEl = document.getElementById("viewerFilterCategory");
  const clearBtn = document.getElementById("viewerFilterClear");
  const applyViewerFilters = () => renderViewerTable(getViewerFilteredProducts());
  if (statusEl) statusEl.addEventListener("change", applyViewerFilters);
  if (categoryEl) categoryEl.addEventListener("change", applyViewerFilters);
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (statusEl) statusEl.value = "";
      if (categoryEl) categoryEl.value = "";
      applyViewerFilters();
    });
  }
}

/** Mode switch binding (kept) */
function bindModeSwitch() {
  if (!modeSwitch || !viewerSection || !editorialSection) return;

  // default to viewer mode
  const isEditorial = !!modeSwitch.checked;
  viewerSection.classList.toggle("hidden", isEditorial);
  editorialSection.classList.toggle("hidden", !isEditorial);

  modeSwitch.addEventListener("change", () => {
    const isEd = modeSwitch.checked;
    viewerSection.classList.toggle("hidden", isEd);
    editorialSection.classList.toggle("hidden", !isEd);
  });
}

/** Global add button (kept) */
function bindAddGeneral() {
  if (!addGeneralBtn) return;
  addGeneralBtn.addEventListener("click", () => openProductForm(null, null));
}

function bindRealtime() {
  // Optional: poll or re-enable Supabase realtime if needed
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

(async function init() {
  myProfile = await requireStaff();
  if (!myProfile) return;

  // Role gating: editorial mode only for senior_employee+
  if (modeSwitch) {
    modeSwitch.disabled = !canUseEditorial(myProfile.role);
  }

  bindModeSwitch();
  bindAddGeneral();
  bindRealtime();
  bindViewerFilters();

  // Delegated listener for viewer table Edit (survives re-renders)
  if (viewerTableBody) {
    viewerTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='edit']");
      if (!btn) return;
      openProductForm(null, btn.dataset.id);
    });
  }

  // Single delegated listener for editorial filtered grid (status + Edit)
  if (categoryContainer) {
    categoryContainer.addEventListener("click", async (e) => {
      const actionBtn = e.target.closest("[data-status-action]");
      const edit = e.target.closest(".editBtn");
      if (actionBtn) {
        const id = actionBtn.dataset.id;
        const targetStatus = actionBtn.dataset.statusAction;
        if (id && targetStatus) {
          const ok = await updateStatus(id, targetStatus);
          if (ok) await loadProducts();
        }
      }
      if (edit) openProductForm(null, edit.dataset.id);
    });
  }

  await loadProducts();
})();
