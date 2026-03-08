// Backend/controllers/meOrdersController.js — POST /api/me/orders (create order from cart)
import { supabaseAdmin } from '../config/supabase.js';

/**
 * GET current user's cart rows with product prices (same shape as meCartController for consistency).
 */
async function getCartForOrder(userId) {
  const { data: rows, error } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      product_id,
      size,
      quantity,
      products ( id, title, price )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (rows || []).map((c) => ({
    cart_item_id: c.id,
    product_id: c.products?.id ?? c.product_id,
    quantity: Number(c.quantity) || 1,
    unit_price: Number(c.products?.price) ?? 0,
    size: c.size ?? null,
  }));
}

/**
 * POST /api/me/orders — create order from current cart, then clear cart.
 * Body: { fullName, email, phone?, address, city?, postalCode? }
 */
export async function createOrder(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fullName, email, phone, address, city, postalCode } = req.body || {};
    if (!fullName?.trim() || !email?.trim() || !address?.trim()) {
      return res.status(400).json({ error: 'Full name, email, and address are required.' });
    }

    const cartLines = await getCartForOrder(userId);
    if (cartLines.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const total = cartLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
    const currency = 'JMD';

    const shipping = {
      fullName: (fullName || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim() || null,
      address: (address || '').trim(),
      city: (city || '').trim() || null,
      postalCode: (postalCode || '').trim() || null,
    };

    // Insert order (with shipping if column exists)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending_payment',
        total: Number(total.toFixed(2)),
        currency,
        shipping,
      })
      .select('id, status, total, currency, created_at')
      .single();

    if (orderError) {
      if (orderError.code === '42703' && orderError.message?.includes('shipping')) {
        return res.status(500).json({
          error: 'Orders table is missing "shipping" column. Run Backend/supabase-orders-migration.sql in Supabase SQL Editor.',
        });
      }
      throw orderError;
    }

    // Insert order_items
    const orderItems = cartLines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      size: line.size,
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('order_items insert:', itemsError);
      return res.status(500).json({
        error: 'Order created but line items failed. You may need to run Backend/supabase-orders-migration.sql to create the order_items table.',
      });
    }

    // Clear cart
    const { error: deleteCartError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    if (deleteCartError) console.error('clear cart after order:', deleteCartError);

    res.status(201).json({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      created_at: order.created_at,
    });
  } catch (err) {
    console.error('createOrder:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
}
