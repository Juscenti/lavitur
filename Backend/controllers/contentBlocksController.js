// Backend/controllers/contentBlocksController.js — public storefront API (no auth)
import { supabaseAdmin } from '../config/supabase.js';

/**
 * GET /api/content-blocks?page=home
 * Returns active content blocks for the storefront, optionally filtered by page.
 * Block is included if page is null (global) or page matches. Order: sort_order ascending.
 */
export async function listPublicContentBlocks(req, res) {
  try {
    const pageParam = req.query.page;
    const pageFilter = pageParam && String(pageParam).trim() ? String(pageParam).trim() : null;

    const { data, error } = await supabaseAdmin
      .from('content_blocks')
      .select('id, slug, title, type, body, media_url, cta_label, cta_url, sort_order, page')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    let list = Array.isArray(data) ? data : [];
    if (pageFilter) {
      list = list.filter((b) => b.page == null || b.page === pageFilter);
    }

    res.json(list);
  } catch (err) {
    console.error('listPublicContentBlocks:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch content blocks' });
  }
}
