# Lavitúr Admin Dashboard (React)

React version of the admin panel. Same UI and API as the original `admin-panel`; uses the same CSS and backend.

## Run

```bash
npm install
npm run dev
```

Dev server: http://localhost:3002

From repo root: `npm run dashboard`

## Environment

**API:** All requests go to **https://lavitur.onrender.com** by default. No local backend needed to run the dashboard.

Optional `.env`:

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key
- `VITE_API_BASE` – Override API base (default: `https://lavitur.onrender.com`)
- `VITE_USE_LOCAL_API=1` – Use local backend at `http://localhost:5000` when running on localhost
- `VITE_MAIN_SITE_URL` – Main frontend URL for "Back to Site" (default: http://localhost:3001)

## Routes

- `/login` – Admin login
- `/` – Dashboard
- `/users`, `/products`, `/orders`, `/content`, `/support`, `/analytics`, `/promotions`, `/loyalty`, `/roles`, `/security`, `/settings`, `/db-tools`
