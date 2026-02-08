// admin-panel/js/discounts.js — uses REST API
import { api } from "./api.js";
import { requireStaff } from "./adminGuard.js";

const elBody = document.querySelector("#discountsTbody");
const elForm = document.querySelector("#createDiscountForm");

async function fetchCodes() {
  const data = await api.get("/admin/discounts");
  return Array.isArray(data) ? data : [];
}

function render(rows) {
  if (!elBody) return;
  elBody.innerHTML = rows
    .map(
      (c) => `
    <tr>
      <td>${c.code}</td>
      <td>${Number(c.discount_percent).toFixed(2)}%</td>
      <td>${c.active ? "active" : "inactive"}</td>
      <td>${c.used_count}/${c.usage_limit ?? "∞"}</td>
      <td>
        <button data-id="${c.id}" data-action="toggle">${c.active ? "Disable" : "Enable"}</button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function createCode(payload) {
  await api.post("/admin/discounts", payload);
}

async function toggleActive(id, active) {
  await api.patch(`/admin/discounts/${id}/active`, { active });
}

async function refresh() {
  render(await fetchCodes());
}

function bind() {
  elForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(elForm);
    try {
      await createCode({
        code: String(fd.get("code") || "").trim(),
        discount_percent: Number(fd.get("discount_percent")),
        active: true,
        ambassador_id: fd.get("ambassador_id") ? String(fd.get("ambassador_id")) : null,
        usage_limit: fd.get("usage_limit") ? Number(fd.get("usage_limit")) : null,
        starts_at: fd.get("starts_at") ? String(fd.get("starts_at")) : null,
        ends_at: fd.get("ends_at") ? String(fd.get("ends_at")) : null,
      });
      elForm.reset();
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err?.data?.error || err?.message || "Failed to create discount.");
    }
  });

  elBody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "toggle") {
      const id = btn.dataset.id;
      const newActive = btn.textContent.trim() === "Enable";
      try {
        await toggleActive(id, newActive);
        await refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to update discount.");
      }
    }
  });
}

(async function init() {
  const profile = await requireStaff();
  if (!profile) return;
  bind();
  await refresh();
})();
