// admin-panel/js/orders.js — uses REST API
import { api } from "./api.js";
import { requireStaff } from "./adminGuard.js";

const elBody = document.querySelector("#ordersTbody");

async function fetchOrders() {
  const data = await api.get("/admin/orders");
  return Array.isArray(data) ? data : [];
}

function render(rows) {
  if (!elBody) return;
  elBody.innerHTML = rows
    .map(
      (o) => `
    <tr>
      <td>${o.id}</td>
      <td>${o.status}</td>
      <td>${o.currency} ${Number(o.total).toFixed(2)}</td>
      <td>${new Date(o.created_at).toLocaleString()}</td>
      <td>
        <select data-id="${o.id}" class="orderStatus">
          ${["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]
            .map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
      </td>
    </tr>
  `
    )
    .join("");
}

async function updateOrderStatus(id, status) {
  await api.patch(`/admin/orders/${id}/status`, { status });
}

async function refresh() {
  render(await fetchOrders());
}

function bind() {
  elBody?.addEventListener("change", async (e) => {
    const sel = e.target.closest("select.orderStatus");
    if (!sel) return;
    try {
      await updateOrderStatus(sel.dataset.id, sel.value);
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
    }
  });
}

(async function init() {
  const profile = await requireStaff();
  if (!profile) return;
  bind();
  await refresh();
})();
