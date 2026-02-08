# Lavitúr REST API (Supabase)

The backend is a REST API that uses **Supabase** for auth and data. All client apps (Frontend + Admin) call this API instead of Supabase directly.

## Setup

1. **Environment**  
   Create `.env` with:

   - `SUPABASE_URL` – your Supabase project URL  
   - `SUPABASE_ANON_KEY` – anon/public key (used to verify user JWTs)  
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (server-only, for DB/storage)

   **Important:** These must be from the **same Supabase project** as the admin panel. If the admin panel uses `admin-panel/js/supabaseClient.js` (e.g. `https://ueotizgitowpvizkbgst.supabase.co`), use that project’s URL and keys in Backend `.env`. Otherwise the API will not find your profile and admin actions will fail with "No role found for current user in profiles."

2. **Run**

   ```bash
   npm install
   npm run dev
   ```

   Server runs on `PORT` (default 5000).

## Auth

- **Login/register** stay in the client (Supabase Auth in the browser).
- **API auth**: client sends `Authorization: Bearer <supabase_access_token>`.
- **Admin routes** require the same token and a profile `role` in `['admin','representative']`.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/categories` | — | List categories (id, name, slug) |
| GET | `/api/products` | — | Published products (shop) |
| GET | `/api/me` | Bearer | Current user profile |
| PATCH | `/api/me` | Bearer | Update profile (username, full_name) |
| GET | `/api/admin/users` | Admin | List users |
| GET | `/api/admin/users/:id` | Admin | Get user |
| PATCH | `/api/admin/users/:id/status` | Admin | Set status (active/suspended) |
| PATCH | `/api/admin/users/:id/role` | Admin | Set role |
| GET | `/api/admin/products` | Admin | List all products |
| POST | `/api/admin/products` | Admin | Create product |
| PATCH | `/api/admin/products/:id` | Admin | Update product |
| PATCH | `/api/admin/products/:id/status` | Admin | Set status (draft/pending/published/archived) |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| GET | `/api/admin/products/:id/media` | Admin | List product media |
| POST | `/api/admin/products/:id/media` | Admin | Upload media (multipart `files`) |
| DELETE | `/api/admin/products/:id/media/:mediaId` | Admin | Delete media |
| PATCH | `/api/admin/products/:id/media/:mediaId/primary` | Admin | Set primary media |
| GET | `/api/admin/orders` | Admin | List orders |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update order status |
| GET | `/api/admin/dashboard` | Admin | Dashboard metrics |
| GET | `/api/admin/discounts` | Admin | List discount codes |
| POST | `/api/admin/discounts` | Admin | Create discount |
| PATCH | `/api/admin/discounts/:id/active` | Admin | Toggle active (body: `{ active: boolean }`) |

## Client config

If the API is on another origin (e.g. backend on `http://localhost:5000`, frontend on `http://localhost:5500`), set before loading the API client:

- **Frontend**: in `Frontend/js/config.js` set `window.API_BASE = "http://localhost:5000"` and load `config.js` before `api.js`.
- **Admin**: in `admin-panel/js/config.js` set `window.API_BASE = "http://localhost:5000"` and load it before `api.js`.

Same-origin (e.g. everything behind one server): leave `API_BASE` unset.
