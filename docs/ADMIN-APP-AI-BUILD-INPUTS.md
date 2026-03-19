# Admin App AI Build Inputs (Lavitur)

## 0) What this doc is
This is a build-brief you can paste into another AI to generate an admin-only app for Lavitúr that integrates with your existing system:
- Supabase (auth + DB + storage)
- Your Express REST backend

This doc focuses on:
1. **Connections** (Supabase URL/keys, backend base URL)
2. **Admin auth** (how the client logs in + how the server enforces admin access)
3. **Supabase table names** the app must read/write (not file names)
4. **Backend admin endpoints** the app must call
5. **Request payloads** the app must send for the major create/update operations

## 1) Supabase connection details

### 1.1 Supabase Project URL (required)
- `SUPABASE_URL`: `https://ueotizgitowpvizkbgst.supabase.co`

### 1.2 Supabase keys (required)
- `SUPABASE_ANON_KEY` (safe to use in the browser): `sb_publishable_Cv6TIwRzZVRs72-Byx2ozA_r7eDR0DX`
- `SUPABASE_SERVICE_ROLE_KEY` (DO NOT use in the browser; server-only)

### 1.3 Where the system defines these
- Backend environment: `Backend/.env`
- Server Supabase clients + public storage URL helpers: `Backend/config/supabase.js`

## 2) Backend REST API connection

### 2.1 Backend base URL (default)
- `https://lavitur.onrender.com`

### 2.2 Admin API path
- All admin functionality is under: `/api/admin/*`

### 2.3 Where the API is mounted
- API mount points are defined in: `Backend/server.js`

### 2.4 Local dev default
- If running the backend locally: `http://localhost:5000`

## 3) Admin authentication + authorization rules

### 3.1 Client login flow (what the app must do)
1. Create a Supabase client using:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. Sign in with email + password using Supabase Auth:
   - `supabase.auth.signInWithPassword({ email, password })`
3. After sign-in, confirm user role from `profiles` (server-side role enforcement still exists):
   - Read `profiles.role` where `profiles.id = session.user.id`
   - Allowed roles for admin UI:
     - `admin`
     - `representative`

### 3.2 Token usage for API calls
For every call to `/api/admin/*`:
- Send header: `Authorization: Bearer <supabase_access_token>`

Where the token comes from:
- The access token is from `session.access_token` returned by Supabase Auth.

### 3.3 Server-side admin enforcement
Your backend middleware (`verifySupabaseToken` + `requireAdmin`) does:
- Validates the Supabase JWT
- Loads `profiles` row for the authenticated user
- Requires `profiles.role` is one of:
  - `admin`
  - `representative`

Where the rules are implemented:
- `Backend/middleware/supabaseAuth.js`

## 4) Supabase storage (media uploads)

Your backend uploads media to Supabase Storage buckets and returns public URLs.

### 4.1 Buckets used by the admin app
- Product media bucket: `product-media`
- Content blocks media bucket: `content-blocks`

### 4.2 Public URL formula used by backend
From `Backend/config/supabase.js`:
- Product media:
  - `${SUPABASE_URL}/storage/v1/object/public/product-media/<filePath>`
- Content blocks media:
  - `${SUPABASE_URL}/storage/v1/object/public/content-blocks/<filePath>`

### 4.3 Product media upload request (admin)
Admin endpoint uses multipart upload:
- POST `/api/admin/products/:id/media`
- Multipart field names:
  - `files` (array, max 10)
- Optional multipart fields (as strings in the form):
  - `makeFirstImagePrimary` (value `'true'` enables primary logic)
  - `color_variant_id` (nullable; links uploaded images to a color variant)
- Files accepted by backend:
  - media_type is derived from mimetype:
    - `video/*` => `video`
    - otherwise => `image`

### 4.4 Content block media upload request (admin)
- POST `/api/admin/content-blocks/upload-image`
- Multipart field name:
  - `file` (single)
- Allowed mimetypes:
  - `image/*` or `video/*`

## 5) Supabase table names the admin app must support
Below are the database tables your existing backend admin endpoints read/write.

### 5.1 Auth, users, roles, security
- `profiles`
  - Used for: login gating, user list, user status updates, role updates, admin support team, security overview
- `login_events`
  - Used for: security failed login events
- `role_definitions`
  - Used for: role matrix
- `role_permissions`
  - Used for: role matrix

### 5.2 Products, categories, and media
- `products`
  - Used for: admin product list, create, update, status update, delete
- `categories`
  - Used for: category selection/labeling
- `product_categories`
  - Used for: many-to-many product/category mapping
- `product_media`
  - Used for: media list, upload, delete, set primary, reassign to color variants
- `product_color_variants`
  - Used for: list/create/update/delete of color variants + linking media

### 5.3 Orders
- `orders`
  - Used for: admin order list, get order, update status, delete
- `order_items`
  - Used for: order line items display; deleted when deleting an order

### 5.4 Discounts and promotions
- `discount_codes`
  - Used for: admin discounts list, get, create, update, active toggle
- `discount_redemptions`
  - Used for: admin promotions list aggregation (redemptions/revenue)

### 5.5 Content (site CMS blocks)
- `content_blocks`
  - Used for: list/get/create/update/delete content blocks; reorder; upload media (returns URL)
- `app_settings`
  - Used for: admin settings + some content integration

### 5.6 Support
- `support_tickets`
  - Used for: list/filter tickets; get one ticket; update ticket; confirm+status updates
- `support_messages`
  - Used for: ticket message thread

### 5.7 Analytics / dashboard KPIs
- `dashboard_metrics`
  - Used for: admin dashboard summary
- `analytics_daily_orders`
  - Used for: daily orders time series
- `analytics_top_products`
  - Used for: top products KPI list
- `analytics_ambassador_performance`
  - Used for: ambassador performance list (top ambassadors)

### 5.8 Loyalty
- `loyalty_accounts`
  - Used for: loyalty overview aggregation
- `loyalty_tiers`
  - Used for: loyalty tier list/details

### 5.9 Database tools / maintenance
- `db_table_stats`
  - Used for: “database health” listing
- `maintenance_jobs`
  - Used for: admin maintenance job queueing + list jobs

## 6) Admin backend endpoints the app must call
All endpoints require:
- `Authorization: Bearer <access_token>`
- server role enforcement: `profiles.role in {admin, representative}`

### 6.1 Users
- `GET /api/admin/users`
  - Response: list of users (id, fullName, username, email, role, status, createdAt)
- `GET /api/admin/users/:id`
  - Response: one user
- `PATCH /api/admin/users/:id/status`
  - Body: `{ status }` where backend normalizes to `active` or `suspended`
- `PATCH /api/admin/users/:id/role`
  - Body: `{ role }` (validated against allowed roles)

### 6.2 Products (CRUD + media + color variants)
- `GET /api/admin/products`
  - Response entries include: `id, name, description, price, stock, status, published, sizes, category, categories, thumbUrl, product_media[]`
- `POST /api/admin/products`
  - Body: `{ title, description, price, stock, categoryName, categoryNames, sizes }`
  - Response: `{ id }`
- `PATCH /api/admin/products/:id`
  - Body: `{ title, description, price, stock, categoryName, categoryNames, sizes }`
  - Response: `{ ok: true }`
- `PATCH /api/admin/products/:id/status`
  - Body: `{ status }` where allowed: `draft | pending | published | archived`
  - Response: `{ ok: true }`
- `DELETE /api/admin/products/:id`
  - Requires `confirm=DELETE` (query string or request body)
  - Response: `{ ok: true }`

Product media:
- `GET /api/admin/products/:id/media`
  - Response: `product_media[]` with `public_url`
- `POST /api/admin/products/:id/media` (multipart)
  - Body fields:
    - `files` (array)
    - optional `makeFirstImagePrimary` = `'true'`
    - optional `color_variant_id`
  - Response: array of inserted `product_media` rows with `public_url`
- `DELETE /api/admin/products/:id/media/:mediaId`
  - Response: `{ ok: true }`
- `PATCH /api/admin/products/:id/media/:mediaId/color`
  - Body: `{ color_variant_id }`
  - Response: `{ ok: true }`
- `PATCH /api/admin/products/:id/media/:mediaId/primary`
  - Response: `{ ok: true }`

Color variants:
- `GET /api/admin/products/:id/color-variants`
  - Response: array of variants, each with `media[]` containing `public_url`
- `POST /api/admin/products/:id/color-variants`
  - Body: `{ color_name, color_hex, is_default, position }`
  - Response: `{ ...variant, media: [] }`
- `PATCH /api/admin/products/:id/color-variants/:variantId`
  - Body: `{ color_name?, color_hex?, is_default?, position? }`
  - Response: `{ ok: true }`
- `DELETE /api/admin/products/:id/color-variants/:variantId`
  - Response: `{ ok: true }`

### 6.3 Orders
- `GET /api/admin/orders`
  - Response: list of orders, each includes `order_items[]`
- `GET /api/admin/orders/:id`
  - Response: one order, includes `order_items[]`
- `PATCH /api/admin/orders/:id/status`
  - Body: `{ status }` allowed:
    - `pending_payment | paid | processing | shipped | delivered | cancelled | refunded`
  - Response: `{ ok: true, status }`
- `DELETE /api/admin/orders/:id`
  - Requires confirmation: `?confirm=DELETE` or body `{ confirm: 'DELETE' }`
  - Response: `{ ok: true }`

### 6.4 Dashboard metrics
- `GET /api/admin/dashboard`
  - Response: one row from `dashboard_metrics` (or defaults if missing)

### 6.5 Discounts / Promotions
- Discounts
  - `GET /api/admin/discounts` (list)
  - `GET /api/admin/discounts/:id`
  - `POST /api/admin/discounts`
    - Body: `{ code, discount_percent, active?, ambassador_id?, ambassador_profile_id?, usage_limit?, starts_at?, ends_at? }`
  - `PATCH /api/admin/discounts/:id`
    - Body: any updatable fields (code, discount_percent, active, ambassador*, usage_limit, starts_at, ends_at, campaign_name)
  - `PATCH /api/admin/discounts/:id/active`
    - Body: `{ active }` boolean
- Promotions (read-only list views)
  - `GET /api/admin/promotions/discount-codes`
    - Optional query:
      - `active=true|false`
      - `ambassador_only=true|false`
  - `GET /api/admin/promotions/ambassadors-without-code`
    - Optional query: `exclude_code_id`

### 6.6 Content blocks (CMS)
- `GET /api/admin/content-blocks` (optional query: `type`, `search`)
  - Response: `{ items: content_blocks[] }`
- `GET /api/admin/content-blocks/:id`
  - Response: content block row
- `POST /api/admin/content-blocks`
  - Body: `{ slug, title, type, body?, media_url?, cta_label?, cta_url?, is_active?, sort_order?, page?, variant? }`
  - Response: inserted row
- `PATCH /api/admin/content-blocks/:id`
  - Body: same required trio: `slug, title, type` + optional fields
  - Response: updated row
- `PATCH /api/admin/content-blocks/reorder`
  - Body: `{ order: [blockId1, blockId2, ...] }`
  - Response: `{ success: true }`
- `POST /api/admin/content-blocks/upload-image` (multipart)
  - Field: `file`
  - Response: `{ url }` (public URL)
- `DELETE /api/admin/content-blocks/:id`
  - Response: `{ success: true }`

### 6.7 Support tickets
- `GET /api/admin/support/tickets` (optional query: `status`, `q`, `priority`, `category`)
  - Response: `{ summary, tickets }`
- `GET /api/admin/support/tickets/:id`
  - Response: `{ ticket, messages }` where messages include `sender_name`
- `PATCH /api/admin/support/tickets/:id`
  - Body: `{ status?, priority?, assignee_profile_id?, category? }`
  - Response: updated ticket row
- `POST /api/admin/support/tickets/:id/messages`
  - Body: `{ body, is_internal_note? }`
  - Response: inserted message row (+ `sender_name`)
- `GET /api/admin/support/team`
  - Response: staff list for assignment (profiles with `role in {admin, representative}`)

### 6.8 Analytics overview
- `GET /api/admin/analytics/overview`
  - Optional query: `from`, `to`
  - Response: `{ kpis, daily, topProducts, topAmbassadors }`

### 6.9 Loyalty
- `GET /api/admin/loyalty/overview`
  - Response includes aggregated members + tier breakdown
- `GET /api/admin/loyalty/tiers`
  - Response includes tier details

### 6.10 Roles & permissions view
- `GET /api/admin/roles/users`
  - Response: list of users where `profiles.role != 'customer'`
- `GET /api/admin/roles/matrix`
  - Response: `{ roles, resources[] }`

### 6.11 Security
- `GET /api/admin/security/overview`
  - Response: locked accounts, failed logins, staff MFA enabled
- `GET /api/admin/security/events`
  - Optional query: `user_id`
  - Response: `{ events }`

### 6.12 Settings
- `GET /api/admin/settings`
  - Response grouped by section: `{ [section]: { [key]: value } }`
- `PATCH /api/admin/settings`
  - Body: `{ [section]: { [name]: value } }`
  - Backend will upsert `app_settings` rows using keys formatted as `${section}.${name}`

### 6.13 Database tools
- `GET /api/admin/database/health`
  - Response: `{ tables: db_table_stats[] }`
- `GET /api/admin/database/jobs`
  - Response: `{ jobs: maintenance_jobs[] }`
- `POST /api/admin/database/jobs`
  - Body: `{ job_key }`
  - Response: inserted job row

## 7) Prompt to give the AI (copy/paste)
Use the following as your “instructions” prompt for the AI that will generate the admin app:

```text
Build a web admin-only app for Lavitúr that integrates with the existing backend REST API and Supabase.

Connections:
- Supabase URL: https://ueotizgitowpvizkbgst.supabase.co
- Supabase anon key: sb_publishable_Cv6TIwRzZVRs72-Byx2ozA_r7eDR0DX
- Backend base URL: https://lavitur.onrender.com
- Admin API base: /api/admin

Admin auth:
- Client must sign in using Supabase email/password, then send Authorization: Bearer <access_token> with every request to /api/admin/*.
- UI must gate pages to roles: profiles.role in {admin, representative}.

Supabase data:
- Do not access the service role from the browser.
- The app must rely on the backend /api/admin/* endpoints for all read/write admin operations.
- The app must support media uploads:
  - POST /api/admin/products/:id/media (multipart field "files")
  - POST /api/admin/content-blocks/upload-image (multipart field "file")

Required pages/sections (implement at least these navigation routes):
- Users, Products, Orders, Content blocks, Support, Analytics, Promotions/Discounts, Loyalty, Roles, Security, Settings, DB tools.

Endpoint contracts:
- Implement UI actions that call the corresponding endpoints exactly as described:
  - users: GET/GET/:id/PATCH status/PATCH role
  - products: GET/POST/PATCH/PATCH status/DELETE; media upload & manage; color variants CRUD
  - orders: GET/GET/:id/PATCH status/DELETE (requires confirm=DELETE)
  - discounts/promotions: list/get/create/update/active; promotions discount-codes + ambassadors-without-code
  - content blocks: list/get/create/update/reorder/upload-image/delete
  - support: list/get/update/add-message; team list
  - analytics: overview (optional from/to)
  - loyalty: overview + tiers
  - roles: users list + matrix
  - security: overview + events (optional user_id)
  - settings: grouped get + patch
  - database tools: health + jobs list + enqueue job (POST job_key)

Data modeling:
- Render API responses as structured tables/cards.
- Use fields returned by endpoints as the source of truth; do not invent column names.

Security:
- Never embed SUPABASE_SERVICE_ROLE_KEY in frontend.
- Never call storage buckets directly from the browser; use backend upload endpoints.

Deliverables:
- Provide the full source code for the admin app and brief setup instructions (how to run locally).
```

## 8) Notes / assumptions
- This doc describes what your current codebase’s backend expects.
- If you expand the admin app with new AI features (notifications, “server control”, etc.), you should add new backend endpoints + new tables and update this doc accordingly.

