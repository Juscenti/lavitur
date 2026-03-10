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

export async function getDiscount(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select('id, code, discount_percent, active, starts_at, ends_at, usage_limit, used_count, campaign_name, ambassador_id, ambassador_profile_id')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Discount not found' });
    res.json({
      ...data,
      ambassador_id: data.ambassador_profile_id || data.ambassador_id || null,
    });
  } catch (err) {
    console.error('getDiscount:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch discount' });
  }
}

/** PATCH /admin/discounts/:id — update any fields (code, discount_percent, active, usage_limit, starts_at, ends_at, ambassador). */
export async function updateDiscount(req, res) {
  try {
    const { id } = req.params;
    const {
      code,
      discount_percent,
      active,
      ambassador_id,
      ambassador_profile_id,
      usage_limit,
      starts_at,
      ends_at,
      campaign_name,
    } = req.body || {};

    const payload = {};
    if (code !== undefined) payload.code = String(code).trim();
    if (discount_percent !== undefined) payload.discount_percent = Number(discount_percent);
    if (typeof active === 'boolean') payload.active = active;
    if (usage_limit !== undefined) payload.usage_limit = usage_limit === '' || usage_limit == null ? null : Number(usage_limit);
    if (starts_at !== undefined) payload.starts_at = starts_at === '' ? null : starts_at;
    if (ends_at !== undefined) payload.ends_at = ends_at === '' ? null : ends_at;
    if (campaign_name !== undefined) payload.campaign_name = campaign_name === '' ? null : campaign_name;
    const ambassadorProfileId = ambassador_profile_id !== undefined ? ambassador_profile_id : ambassador_id;
    if (ambassadorProfileId !== undefined) {
      const idVal = ambassadorProfileId === '' || ambassadorProfileId == null ? null : ambassadorProfileId;
      payload.ambassador_id = idVal;
      payload.ambassador_profile_id = idVal;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { error } = await supabaseAdmin.from('discount_codes').update(payload).eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('updateDiscount:', err);
    res.status(500).json({ error: err.message || 'Failed to update discount' });
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
