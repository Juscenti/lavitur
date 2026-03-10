// Backend/controllers/meDiscountController.js — validate discount code for checkout
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Validate a discount code for a given subtotal. Used at checkout to show discount and when placing order.
 * Returns { valid, discount_code_id?, code?, discount_percent?, discount_amount?, message? }
 */
export async function validateDiscount(req, res) {
  try {
    const { code, subtotal } = req.body || {};
    const subTotal = Number(subtotal);
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.json({ valid: false, message: 'Please enter a discount code.' });
    }
    if (Number.isNaN(subTotal) || subTotal < 0) {
      return res.json({ valid: false, message: 'Invalid subtotal.' });
    }

    const codeTrim = code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from('discount_codes')
      .select('id, code, discount_percent, active, starts_at, ends_at, usage_limit, used_count, min_order_total')
      .ilike('code', codeTrim)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') return res.json({ valid: false, message: 'Discount codes are not configured.' });
      throw error;
    }
    if (!row) {
      return res.json({ valid: false, message: 'Invalid or expired discount code.' });
    }

    if (row.active === false) {
      return res.json({ valid: false, message: 'This discount code is no longer active.' });
    }

    const now = new Date().toISOString();
    if (row.starts_at && new Date(row.starts_at) > new Date(now)) {
      return res.json({ valid: false, message: 'This code is not valid yet.' });
    }
    if (row.ends_at && new Date(row.ends_at) < new Date(now)) {
      return res.json({ valid: false, message: 'This discount code has expired.' });
    }

    const usageLimit = row.usage_limit != null ? Number(row.usage_limit) : null;
    if (usageLimit != null && usageLimit > 0) {
      const used = Number(row.used_count ?? 0);
      if (used >= usageLimit) {
        return res.json({ valid: false, message: 'This code has reached its usage limit.' });
      }
    }

    const minOrder = row.min_order_total != null ? Number(row.min_order_total) : null;
    if (minOrder != null && minOrder > 0 && subTotal < minOrder) {
      return res.json({
        valid: false,
        message: `This code requires a minimum order of JMD ${Number(minOrder).toFixed(0)}.`,
      });
    }

    const percent = Number(row.discount_percent) ?? 0;
    const discountAmount = Number((subTotal * (percent / 100)).toFixed(2));

    return res.json({
      valid: true,
      discount_code_id: row.id,
      code: row.code,
      discount_percent: percent,
      discount_amount: discountAmount,
    });
  } catch (err) {
    console.error('validateDiscount:', err);
    res.status(500).json({ error: err.message || 'Failed to validate discount code' });
  }
}
