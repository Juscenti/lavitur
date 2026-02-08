// Backend/controllers/categoriesController.js
import { supabaseAdmin } from '../config/supabase.js';

export async function listCategories(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('listCategories:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
}
