-- ============================================================
-- Migration: Color & Size Variants
-- Run this in the Supabase SQL Editor (or via psql)
-- ============================================================

-- 1. Add optional sizes array to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT NULL;

-- 2. Create the colour variants table
CREATE TABLE IF NOT EXISTS product_color_variants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name  TEXT        NOT NULL,
  color_hex   TEXT,                  -- optional, e.g. "#1a2a4a"
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcv_product_id ON product_color_variants (product_id);

-- 3. Link product_media rows to a colour variant (NULL = base / all-colour image)
ALTER TABLE product_media
  ADD COLUMN IF NOT EXISTS color_variant_id UUID
    REFERENCES product_color_variants(id) ON DELETE SET NULL;

-- 4. Row Level Security for product_color_variants
--    Public read (matches products table RLS pattern).
--    Write operations use the service-role key from the backend, so no extra
--    INSERT/UPDATE/DELETE policies are needed unless you want user-level policies.
ALTER TABLE product_color_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read color variants" ON product_color_variants;
CREATE POLICY "Public read color variants"
  ON product_color_variants FOR SELECT
  USING (true);
