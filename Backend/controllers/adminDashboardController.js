// Backend/controllers/adminDashboardController.js
import { supabaseAdmin } from '../config/supabase.js';

export async function getMetrics(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dashboard_metrics')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ gross_revenue: 0, total_orders: 0, total_users: 0 });
      }
      throw error;
    }
    res.json(data || {});
  } catch (err) {
    console.error('getMetrics:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard metrics' });
  }
}
