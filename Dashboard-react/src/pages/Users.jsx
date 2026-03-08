import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import '../styles/users.css';

const ALLOWED_ROLES = ['customer', 'ambassador', 'employee', 'senior employee', 'representative', 'admin'];

export default function Users() {
  const [userData, setUserData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalUserDetails, setModalUserDetails] = useState(null);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteUser, setPromoteUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.get('/admin/users');
      const list = Array.isArray(data) ? data : [];
      setUserData(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
      alert('Failed to load users.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    const list = userData.filter(
      (u) =>
        (u.fullName ?? '').toLowerCase().includes(q) ||
        (u.username ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
    );
    setFiltered(list);
  }, [search, userData]);

  const handleView = async (user) => {
    try {
      const data = await api.get(`/admin/users/${user.id}`);
      setModalUserDetails({
        full_name: data.full_name ?? '',
        username: data.username ?? '',
        email: data.email ?? '',
        role: data.role ?? '',
        status: data.status ?? '',
        joined: data.createdAt ?? (data.created_at ? new Date(data.created_at).toLocaleString() : ''),
      });
      setUserModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Unable to view user.');
    }
  };

  const handleSuspend = async (user) => {
    try {
      const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setUserData((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      setFiltered((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update user status.');
    }
  };

  const openPromoteModal = (user) => {
    setPromoteUser(user);
    setNewRole(user.role ?? '');
    setPromoteModalOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!promoteUser || !newRole || newRole === promoteUser.role) {
      setPromoteModalOpen(false);
      return;
    }
    if (!ALLOWED_ROLES.includes(newRole)) {
      alert('Invalid role selected.');
      return false;
    }
    try {
      await api.patch(`/admin/users/${promoteUser.id}/role`, { role: newRole });
      alert('User role updated.');
      await loadUsers();
      setPromoteModalOpen(false);
    } catch (err) {
      console.error('promoteUser() failed:', err);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('not authorized') || err?.status === 403) {
        alert('Promotion blocked: your account is not authorized to change roles.');
      } else if (msg.includes('invalid role')) {
        alert('Promotion blocked: the selected role is not allowed.');
      } else if (msg.includes('not found') || err?.status === 404) {
        alert('Promotion failed: target user does not exist.');
      } else {
        alert('Promotion failed. Check console for details.');
      }
    }
  };

  return (
    <>
      <h1>All Users</h1>
      <div className="table-container">
        <div className="user-controls">
          <input
            type="text"
            id="userSearchInput"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          id="userModal"
          className={`modal ${userModalOpen ? '' : 'hidden'}`}
          onClick={() => setUserModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setUserModalOpen(false)} aria-hidden="true">
              &times;
            </span>
            <h2>User Profile</h2>
            <div id="modalUserDetails">
              {modalUserDetails && (
                <>
                  <p><strong>Full Name:</strong> {modalUserDetails.full_name}</p>
                  <p><strong>Username:</strong> {modalUserDetails.username}</p>
                  <p><strong>Email:</strong> {modalUserDetails.email}</p>
                  <p><strong>Role:</strong> {modalUserDetails.role}</p>
                  <p><strong>Status:</strong> {modalUserDetails.status}</p>
                  <p><strong>Joined:</strong> {modalUserDetails.joined}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          id="promoteModal"
          className={`modal ${promoteModalOpen ? '' : 'hidden'}`}
          onClick={() => setPromoteModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setPromoteModalOpen(false)} aria-hidden="true">
              &times;
            </span>
            <h2>Promote User</h2>
            <p id="promoteUsernameLabel">
              {promoteUser ? `Change role for: ${promoteUser.username}` : ''}
            </p>
            <select
              id="newRoleSelect"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="representative">Representative</option>
              <option value="senior employee">Senior Employee</option>
              <option value="employee">Employee</option>
              <option value="ambassador">Model / Ambassador</option>
              <option value="customer">Customer</option>
            </select>
            <div className="modal-buttons">
              <button id="confirmPromoteBtn" type="button" onClick={handleConfirmPromote}>
                Confirm
              </button>
              <button id="cancelPromoteBtn" type="button" onClick={() => setPromoteModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName ?? ''}</td>
                <td>{user.username ?? ''}</td>
                <td>{user.email ?? ''}</td>
                <td>{user.role ?? ''}</td>
                <td className="status-cell">{user.status ?? ''}</td>
                <td>{user.createdAt ?? ''}</td>
                <td>
                  <button type="button" className="action-btn view" onClick={() => handleView(user)}>
                    View
                  </button>
                  {user.role !== 'admin' && (
                    <>
                      <button
                        type="button"
                        className="action-btn suspend"
                        onClick={() => handleSuspend(user)}
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        className="action-btn promote"
                        onClick={() => openPromoteModal(user)}
                      >
                        Promote
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
