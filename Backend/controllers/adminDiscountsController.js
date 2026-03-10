// Backend/controllers/adminDiscountsController.js
import { supabaseAdmin } from '../config/supabase.js';

export async function listDiscounts(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select('id, code, discount_percent, active, starts_at, ends_at, used_count, usage_limit, ambassador_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('listDiscounts:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch discounts' });
  }
}

export async function createDiscount(req, res) {
  try {
    const {
      code,
      discount_percent,
      active = true,
      ambassador_id,
      ambassador_profile_id,
      usage_limit,
      starts_at,
      ends_at,
    } = req.body;

    if (!code || discount_percent == null) {
      return res.status(400).json({ error: 'code and discount_percent required' });
    }

    const ambassadorProfileId = ambassador_profile_id || ambassador_id || null;
    const payload = {
      code: String(code).trim(),
      discount_percent: Number(discount_percent),
      active: !!active,
      usage_limit: usage_limit ? Number(usage_limit) : null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
    };
    if (ambassadorProfileId) {
      payload.ambassador_id = ambassadorProfileId;
      payload.ambassador_profile_id = ambassadorProfileId;
    }

    const { error } = await supabaseAdmin.from('discount_codes').insert(payload);

    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('createDiscount:', err);
    res.status(500).json({ error: err.message || 'Failed to create discount' });
  }
}

export async function updateDiscountActive(req, res) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active (boolean) required' });
    }

    const { error } = await supabaseAdmin.from('discount_codes').update({ active }).eq('id', id);
    if (error) throw error;
    res.json({ ok: true, active });
  } catch (err) {
    console.error('updateDiscountActive:', err);
    res.status(500).json({ error: err.message || 'Failed to update discount' });
  }
}
