// Backend/controllers/adminOrdersController.js
import { supabaseAdmin } from '../config/supabase.js';

export async function listOrders(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, total, currency, created_at, updated_at, user_id')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('listOrders:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
    res.json({ ok: true, status });
  } catch (err) {
    console.error('updateOrderStatus:', err);
    res.status(500).json({ error: err.message || 'Failed to update order' });
  }
}
