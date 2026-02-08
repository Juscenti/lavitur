// admin-panel/js/dashboard.js — uses REST API for metrics
import { api } from "./api.js";
import { requireStaff } from "./adminGuard.js";

let myProfile = null;

(async () => {
  myProfile = await requireStaff();
  if (!myProfile) return;
})();

function formatCurrency(n, currency = "JMD") {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const loadComponent = window.loadComponent;
  if (typeof loadComponent === "function") {
    await loadComponent("./components/sidebar.html", "#sidebar");
    await loadComponent("./components/header.html", "#topbar");
  }

  try {
    const data = await api.get("/admin/dashboard");
    const byId = (id) => document.getElementById(id);

    if (byId("sales-total")) byId("sales-total").textContent = formatCurrency(data.gross_revenue, "JMD");
    if (byId("orders-today")) byId("orders-today").textContent = String(data.total_orders ?? "—");
    if (byId("new-users")) byId("new-users").textContent = "—";
    if (byId("open-tickets")) byId("open-tickets").textContent = "—";
  } catch (e) {
    console.warn("Failed to load dashboard metrics:", e);
  }

  const canvas = document.getElementById("salesChart");
  if (canvas && window.Chart) {
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Weekly Sales",
            data: [2100, 3100, 1800, 4500, 3500, 5000, 4300],
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "#3B82F6",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });
  }
});
