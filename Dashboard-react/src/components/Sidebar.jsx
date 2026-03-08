import { Link, useLocation } from 'react-router-dom';

const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || 'http://localhost:3001';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/products', label: 'Products' },
    { to: '/orders', label: 'Orders' },
    { to: '/content', label: 'Content' },
    { to: '/support', label: 'Support' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/promotions', label: 'Promotions' },
    { to: '/loyalty', label: 'Loyalty' },
    { to: '/roles', label: 'Roles' },
    { to: '/security', label: 'Security' },
    { to: '/settings', label: 'Settings' },
    { to: '/db-tools', label: 'Database' },
  ];

  return (
    <aside id="sidebar">
      <nav className="sidebar-nav">
        <h2 className="logo">Lavitúr Admin</h2>
        <ul>
          {navItems.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <a href={MAIN_SITE_URL} target="_blank" rel="noopener noreferrer">
              ← Back to Site
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
