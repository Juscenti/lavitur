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

/** Role gating: only Senior Employee+ can use editorial mode */
function canUseEditorial(role) {
  // your roles: employee, senior_employee, representative, admin
  return ["senior employee", "representative", "admin"].includes(role);
}

/** API returns { id, name, description, price, stock, status, published, category, thumbUrl } */
function toUiProduct(row) {
  return {
    id: row.id,
    name: row.name ?? row.title,
    description: row.description ?? "",
    price: row.price,
    stock: row.stock ?? "",
    status: row.status,
    published: row.published ?? row.status === "published",
    category: row.category ?? "Unassigned",
    thumbUrl: row.thumbUrl ?? null,
  };
}


/** Money formatting */
function formatMoney(n) {
  const v = Number(n || 0);
  return `JMD ${v.toFixed(2)}`;
}

/** Populate the category dropdown in the product form modal */
function fillCategorySelect(selectedName = null) {
  const sel = document.getElementById("productCategorySelect");
  if (!sel) return;

  const options = ["Unassigned", ...(categories || []).map((c) => c.name)];
  sel.innerHTML = options
    .map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`)
    .join("");

  sel.value = selectedName || "Unassigned";
}

async function createProduct({ title, description, price, stock, categoryName }) {
  const res = await api.post("/admin/products", {
    title,
    description: description || null,
    price,
    stock,
    categoryName: categoryName || "Unassigned",
  });
  return res.id;
}

async function updateProduct(productId, { title, description, price, stock, categoryName }) {
  await api.patch(`/admin/products/${productId}`, {
    title,
    description: description || null,
    price,
    stock,
    categoryName: categoryName || "Unassigned",
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
  renderViewerTable(productData);
  renderEditorialView(productData);
  } catch (err) {
    console.error(err);
    alert("Failed to load products");
  }
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

  // Edit click (opens modal in edit mode)
  viewerTableBody.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("button[data-action='edit']");
      if (!btn) return;
      openProductForm(null, btn.dataset.id);
    },
    { once: true }
  );
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

// ✅ REPLACE your entire renderEditorialView with this version
function renderEditorialView(products) {
  if (!categoryContainer) return;

  categoryContainer.innerHTML = "";
  const categoryMap = {};

  products.forEach((prod) => {
    const cat = prod.category || "Unassigned";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(prod);
  });

  Object.keys(categoryMap)
    .sort()
    .forEach((category) => {
      const block = document.createElement("div");
      block.className = "category-block";
      block.dataset.category = category;

      block.innerHTML = `
      <div class="category-header">
        <h3>${escapeHtml(category)}</h3>
        <button class="addInCategoryBtn">+ Add Product</button>
      </div>

      <div class="product-grid">
        ${categoryMap[category]
          .map((p) => {
            const status = (p.status || "draft").toLowerCase();
            const statusText = status === "published" ? "Live" : status === "pending" ? "Pending" : status === "archived" ? "Archived" : "Draft";
            const badgeClass = statusBadgeClass(p.status);
            const actionButtons = getStatusActionButtons(p.id, status);

            return `
              <div class="product-card" data-id="${p.id}">
                <div class="pcard-top">
                  <div class="pcard-thumb">
                    ${p.thumbUrl
                      ? `<img src="${p.thumbUrl}" alt="${escapeHtml(p.name)}" />`
                      : `<div class="pcard-thumb--empty">No Image</div>`
                    }

                    <div class="pcard-badge ${badgeClass}">
                      ${escapeHtml(statusText)}
                    </div>
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
          })
          .join("")}
      </div>
    `;

      categoryContainer.appendChild(block);
    });

  // Bind Add buttons in category blocks
  document.querySelectorAll(".addInCategoryBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = e.target.closest(".category-block")?.dataset.category || null;
      openProductForm(category, null);
    });
  });

  // Bind status action + Edit in editorial cards
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

    if (edit) {
      openProductForm(null, edit.dataset.id);
    }
  });
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
  fillCategorySelect(categoryName || "Unassigned");

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
      const payload = {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        price: Number(fd.get("price")),
        stock: Number(fd.get("stock")),
        categoryName: String(fd.get("categoryName") || "Unassigned"),
      };

      if (!payload.title) {
        alert("Name is required.");
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
    fillCategorySelect(existing.category || "Unassigned");
  }

  modal.classList.remove("hidden");
  cancelBtn.onclick = close;

  // ✅ Media: load + bind upload input for existing product
  await renderMediaGrid(productId);
  bindMediaInputForExistingProduct(productId);

  form.onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      price: Number(fd.get("price")),
      stock: Number(fd.get("stock")),
      categoryName: String(fd.get("categoryName") || "Unassigned"),
    };

    if (!payload.title) {
      alert("Name is required.");
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

  await loadProducts();
})();
