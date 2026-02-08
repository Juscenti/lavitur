// admin-panel/js/users.js — uses REST API
import { api } from "./api.js";
import { requireStaff } from "./adminGuard.js";

let myProfile = null;

const tableBody = document.getElementById("userTableBody");
const searchInput = document.getElementById("userSearchInput");
const modal = document.getElementById("userModal");
const closeModalBtn = document.getElementById("closeUserModal");
const modalDetails = document.getElementById("modalUserDetails");

if (!tableBody || !searchInput) {
  console.warn("users.js: expected table/search elements not found on this page.");
}

let userData = [];

function renderTable(users) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.fullName ?? ""}</td>
      <td>${user.username ?? ""}</td>
      <td>${user.email ?? ""}</td>
      <td>${user.role ?? ""}</td>
      <td class="status-cell">${user.status ?? ""}</td>
      <td>${user.createdAt ?? ""}</td>
      <td>
        <button class="action-btn view">View</button>
        ${user.role === "admin" ? "" : `<button class="action-btn suspend">Suspend</button>`}
        ${user.role === "admin" ? "" : `<button class="action-btn promote">Promote</button>`}
      </td>
    `;
    tableBody.appendChild(row);

    const suspendBtn = row.querySelector(".suspend");
    if (suspendBtn) {
      suspendBtn.addEventListener("click", async () => {
        try {
          const newStatus = user.status === "suspended" ? "active" : "suspended";
          await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
          user.status = newStatus;
          row.querySelector(".status-cell").textContent = user.status;
        } catch (err) {
          console.error(err);
          alert("Failed to update user status.");
        }
      });
    }

    const viewBtn = row.querySelector(".view");
    if (viewBtn) {
      viewBtn.addEventListener("click", async () => {
        try {
          const data = await api.get(`/admin/users/${user.id}`);
          if (modalDetails && modal) {
            modalDetails.innerHTML = `
              <p><strong>Full Name:</strong> ${data.full_name ?? ""}</p>
              <p><strong>Username:</strong> ${data.username ?? ""}</p>
              <p><strong>Email:</strong> ${data.email ?? ""}</p>
              <p><strong>Role:</strong> ${data.role ?? ""}</p>
              <p><strong>Status:</strong> ${data.status ?? ""}</p>
              <p><strong>Joined:</strong> ${data.createdAt ?? (data.created_at ? new Date(data.created_at).toLocaleString() : "")}</p>
            `;
            modal.classList.remove("hidden");
          }
        } catch (err) {
          console.error(err);
          alert("Unable to view user.");
        }
      });
    }

    const promoteBtn = row.querySelector(".promote");
    if (promoteBtn) {
      promoteBtn.addEventListener("click", () => {
        const dlg = document.getElementById("promoteModal");
        if (!dlg) return;
        dlg.classList.remove("hidden");
        document.getElementById("promoteUsernameLabel").textContent = `Change role for: ${user.username}`;
        document.getElementById("newRoleSelect").value = user.role;

        document.getElementById("confirmPromoteBtn").onclick = async () => {
          const selected = document.getElementById("newRoleSelect").value;
          if (selected && selected !== user.role) {
            await promoteUser(user.id, selected);
          }
          dlg.classList.add("hidden");
        };

        document.getElementById("cancelPromoteBtn").onclick =
          document.getElementById("closePromoteModal").onclick = () => {
            dlg.classList.add("hidden");
          };
      });
    }
  });
}

const ALLOWED_ROLES = ["customer", "ambassador", "employee", "senior employee", "representative", "admin"];

async function promoteUser(userId, newRole) {
  if (!userId) {
    alert("Missing target user.");
    return false;
  }
  if (!newRole || !ALLOWED_ROLES.includes(newRole)) {
    alert("Invalid role selected.");
    return false;
  }
  try {
    await api.patch(`/admin/users/${userId}/role`, { role: newRole });
    alert("User role updated.");
    await loadUsers();
    return true;
  } catch (err) {
    console.error("promoteUser() failed:", err);
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("not authorized") || err?.status === 403) {
      alert("Promotion blocked: your account is not authorized to change roles.");
    } else if (msg.includes("invalid role")) {
      alert("Promotion blocked: the selected role is not allowed.");
    } else if (msg.includes("not found") || err?.status === 404) {
      alert("Promotion failed: target user does not exist.");
    } else {
      alert("Promotion failed. Check console for details.");
    }
    return false;
  }
}

if (closeModalBtn && modal) {
  closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    const filtered = userData.filter(
      (u) =>
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    );
    renderTable(filtered);
  });
}

async function loadUsers() {
  try {
    const data = await api.get("/admin/users");
    userData = Array.isArray(data) ? data : [];
    renderTable(userData);
  } catch (err) {
    console.error("User fetch error:", err);
    alert("Failed to load users.");
  }
}

(async function init() {
  myProfile = await requireStaff();
  if (!myProfile) return;
  await loadUsers();
})();
