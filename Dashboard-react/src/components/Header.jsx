import { useLocation } from 'react-router-dom';
import { signOut } from '../lib/adminGuard';

const routeTitles = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/products': 'Products',
  '/orders': 'Orders',
  '/content': 'Content',
  '/support': 'Support',
  '/analytics': 'Analytics',
  '/promotions': 'Promotions',
  '/loyalty': 'Loyalty',
  '/roles': 'Roles',
  '/security': 'Security',
  '/settings': 'Settings',
  '/db-tools': 'Database',
};

function getTitle(pathname) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  for (const [path, title] of Object.entries(routeTitles)) {
    if (path !== '/' && pathname.startsWith(path)) return title;
  }
  return 'Dashboard';
}

export default function Header({ profile, onLogout }) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  const handleLogout = () => {
    if (onLogout) onLogout();
    else signOut();
  };

  return (
    <header id="topbar">
      <div className="topbar-wrapper">
        <div className="admin-title">{title}</div>
        <div className="admin-user">
          <img
            src="/admin-panel/assets/LOGO2.png"
            alt="Admin"
            className="avatar"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span>{profile?.username || profile?.email || 'Admin'}</span>
        </div>
      </div>
      <button type="button" id="logoutBtn" className="logout-btn" onClick={handleLogout}>
        Log Out
      </button>
    </header>
  );
}
