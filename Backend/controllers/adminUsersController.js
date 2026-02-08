// Backend/controllers/adminUsersController.js
import { supabaseAdmin } from '../config/supabase.js';

export async function listUsers(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, email, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list = (data || []).map((row) => ({
      id: row.id,
      fullName: row.full_name ?? '',
      username: row.username ?? '',
      email: row.email ?? '',
      role: row.role ?? '',
      status: row.status ?? 'active',
      createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
    }));

    res.json(list);
  } catch (err) {
    console.error('listUsers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, email, role, status, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...data,
      fullName: data.full_name,
      createdAt: data.created_at ? new Date(data.created_at).toLocaleString() : '',
    });
  } catch (err) {
    console.error('getUser:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: user } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot change admin status' });

    const newStatus = status === 'suspended' ? 'suspended' : 'active';
    const { error } = await supabaseAdmin.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    res.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error('updateUserStatus:', err);
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
}

const ALLOWED_ROLES = ['customer', 'ambassador', 'employee', 'senior employee', 'representative', 'admin'];

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data: user } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({ error: 'Cannot demote admin' });
    }

    const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
    res.json({ ok: true, role });
  } catch (err) {
    console.error('updateUserRole:', err);
    res.status(500).json({ error: err.message || 'Failed to update role' });
  }
}
