# Content blocks storage bucket

The Content Management page uploads images to Supabase Storage for the `media_url` field of content blocks.

## Setup

1. In **Supabase Dashboard** go to **Storage** and create a new bucket.
2. **Name**: `content-blocks`
3. **Public bucket**: enable so the backend can return public URLs (same pattern as `product-media`).
4. No RLS policy is required if the bucket is public and uploads are done server-side with the service role.

Upload paths used by the API: `{uuid}-{sanitizedFilename}` (e.g. `a1b2c3d4-...-hero-image.jpg`).
