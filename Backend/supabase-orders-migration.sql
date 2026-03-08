-- Run this in Supabase → SQL Editor to support checkout orders and line items.
-- Prerequisite: `orders` table exists with at least: id (uuid), user_id, status, total, currency, created_at, updated_at.

-- 1) Add shipping info to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping JSONB DEFAULT NULL;

-- 2) Create order_items for line items (one row per product in an order)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Optional: RLS (allow admin to read all; users to read their own orders via orders.user_id)
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
