-- Add optional page column to content_blocks (run after main content-blocks.sql)
-- Use for storefront: GET /api/content-blocks?page=home returns blocks where (page IS NULL OR page = 'home').

ALTER TABLE content_blocks
  ADD COLUMN IF NOT EXISTS page TEXT;

COMMENT ON COLUMN content_blocks.page IS 'Page context: e.g. ''home''. Null = show on all pages that list blocks by page.';
