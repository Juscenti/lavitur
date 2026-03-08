import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Content from './pages/Content';
import Support from './pages/Support';
import Analytics from './pages/Analytics';
import Promotions from './pages/Promotions';
import Loyalty from './pages/Loyalty';
import Roles from './pages/Roles';
import Security from './pages/Security';
import Settings from './pages/Settings';
import DbTools from './pages/DbTools';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="content" element={<Content />} />
        <Route path="support" element={<Support />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="roles" element={<Roles />} />
        <Route path="security" element={<Security />} />
        <Route path="settings" element={<Settings />} />
        <Route path="db-tools" element={<DbTools />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
