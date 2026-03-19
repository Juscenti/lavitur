# Admin App & System — How to Build It

This document explains how to build the admin app and system you described: checking backend status, notifications (new orders, negative reviews, low stock, new products to review), server monitoring (start/stop), and a “parent AI” with two sub-versions (dashboard vs frontend). It is based on a full scan of your repo and is a **plan and guide**, not an implementation.

---

## 1. What You Have Today (Relevant Pieces)

| Area | What exists |
|------|-------------|
| **Backend** | `Backend/` — Express on port 5000, Supabase (service + anon), JWT auth, admin routes under `/api/admin/*` (users, products, orders, dashboard, analytics, support, roles, security, settings, database jobs). |
| **Dashboard** | `Dashboard-react/` — React (Vite) admin UI; uses `VITE_API_BASE` (e.g. `https://lavitur.onrender.com`) and Supabase session; `requireAdmin` protects all admin API calls. |
| **Frontend** | `Frontend/` (static) + `frontend-react/` (React). Customer site; cart, orders, wishlist, profile; Supabase auth. |
| **AI** | `lavitur-ai-server/` — separate Express app (e.g. port 5001); single endpoint `POST /api/ai`; OpenAI + product search; **no auth** on AI routes. Frontend uses it via `AiWidget.jsx` and `VITE_AI_API_BASE`. |
| **Auth** | Supabase Auth (JWT). Backend: `verifySupabaseToken` + `requireAdmin` (roles `admin`, `representative`). |
| **Data for alerts** | Orders and products in Supabase; `product_reviews` (rating, body); `dashboard_metrics`; `maintenance_jobs` table (jobs are enqueued via API but **no worker runs them** in this repo). |
| **Server run** | Backend: `npm run backend` (nodemon) or `npm start` in Backend. AI server: run manually (e.g. `node index.js`). No PM2 or process manager in repo; production Backend is likely on Render. |

So: you already have the **data and APIs** for “status of things”; you need **notifications**, **server control**, and **AI structure** (parent + two sub-versions) designed on top of this.

---

## 2. High-Level Architecture of What You Want

- **Admin app**  
  - One place (app or dashboard) where **you** see: backend status, notifications (orders, reviews, stock, new products to review), and optionally server control.
- **Notifications**  
  - New orders, “considerable negative reviews” on an item, low stock, new products submitted by employees (to overview).
- **Server monitoring & control**  
  - See server status; start/stop (or restart) the backend (and optionally AI server).
- **Parent AI + two sub-versions**  
  - **Parent**: Your “command center” AI — smarter, reports to you, can summarize alerts and suggest actions; lives with the admin app/dashboard.  
  - **Sub 1 (dashboard/frontend admin)**: Same as parent or slightly reduced — used in the dashboard/admin app, reports back to you.  
  - **Sub 2 (frontend)**: Customer-facing AI — basic help on the frontend site (your current `lavitur-ai-server` shopping concierge).

Dashboard and app can share the “smarter” AI; the frontend keeps the lighter customer-facing AI.

---

## 3. Tech Stack Recommendations

### 3.1 Admin app (the “app” you open to see everything)

- **Option A — Extend Dashboard-react**  
  - Add new pages/sections: “Notifications”, “Server”, “AI command”.  
  - Reuse existing auth (`Bearer` + admin role), API client, and layout.  
  - Easiest: one codebase, one login, same CORS/API base.
- **Option B — Separate “Admin app” (e.g. React Native / Expo or PWA)**  
  - For mobile-style “app” with push notifications.  
  - Still call your Backend and Supabase; use same admin APIs and tokens.

**Recommendation:** Start with **Option A** (Dashboard-react) for status, notifications, and AI. Add a PWA or native app later if you want push on your phone.

### 3.2 Notifications (new orders, reviews, stock, new products)

- **In-app:**  
  - Backend: store notifications in Supabase (e.g. `admin_notifications` table: `type`, `title`, `body`, `read`, `created_at`, `meta` JSON).  
  - Dashboard (or admin app): poll `GET /api/admin/notifications` or use **Supabase Realtime** on that table so the UI updates live.  
- **Push to you (email / mobile):**  
  - **Email:** Resend, SendGrid, or Supabase Edge Function + provider.  
  - **Mobile push:** Firebase Cloud Messaging (FCM) or OneSignal; admin app (PWA or native) subscribes and Backend or a small worker sends payloads.  
- **Who creates the notifications?**  
  - **Option 1 — Backend:** In existing routes (e.g. when order is created, when review is added, when product status = “pending”), insert a row into `admin_notifications`.  
  - **Option 2 — Worker:** A small Node (or Supabase Edge) job that runs periodically: “last 5 min orders”, “reviews with rating ≤ 2”, “stock &lt; threshold”, “products with status = pending review”; then insert notifications.  
  - Start with Option 1 where easy (e.g. order created); use Option 2 for “considerable negative reviews” and “low stock” so you can batch and throttle.

**Tech:**  
- **DB:** PostgreSQL (Supabase) — table for notifications.  
- **Realtime:** Supabase Realtime (subscribe as admin) for instant in-app updates.  
- **Email:** Any transactional email API; call from Backend or Edge Function when creating high-priority notifications.

### 3.3 Server monitoring and start/stop

- **Where things run:**  
  - Backend is likely on **Render** (or similar). You don’t run a long-lived shell on Render; you only have the Node process.  
  - So “stop/start” usually means: **restart the service** via the host’s API (e.g. Render “manual deploy” or “restart” API), not a random script inside your app killing the process (that would just kill the current request).

**Practical approach:**

1. **Monitoring (read-only)**  
   - Backend: already has `GET /api/health`.  
   - Add an **admin-only** route, e.g. `GET /api/admin/server/status`, that returns:  
     - Backend health,  
     - Optional: last deploy time, environment name (from env or host).  
   - For AI server: either an admin-only proxy from Backend to `GET http://ai-server/api/health`, or the Dashboard calls the AI server’s health URL (with CORS allowed for dashboard origin). Store AI base URL in env (e.g. `AI_SERVER_URL`).

2. **Restart / control**  
   - **On Render:** Use Render’s API (e.g. “deploy” or “restart”) with an API key. Your Backend **must not** store that key in frontend; only in Backend env.  
   - Add **admin-only** endpoints, e.g.:  
     - `POST /api/admin/server/restart-backend`  
     - `POST /api/admin/server/restart-ai`  
   - Backend implementation: call Render (or your host) API to trigger deploy/restart. If AI runs on the same host or another, do the same for that service.  
   - **Security:** Only admin role; rate-limit these endpoints (e.g. 1 restart per 5 minutes); optionally require 2FA or a “restart token” for extra safety.

3. **If you self-host (VPS with PM2)**  
   - Backend and AI could be PM2 processes. Then a **separate small “control” service** (or a secured script) on the same machine could run `pm2 restart backend` via `child_process`. That control service must be protected (e.g. internal-only HTTP with a secret token, or SSH-only). Never expose raw shell to the internet.

**Recommendation:** Implement monitoring in Backend + Dashboard first; then add restart via host API (e.g. Render) so you don’t need to open Render dashboard to restart.

### 3.4 Parent AI and two sub-versions

- **Concept**  
  - **Parent AI:** The “brain” you talk to in the admin app. It can:  
    - Read summaries of notifications (orders, reviews, stock, pending products).  
    - Answer questions about the business (“How many orders today?”, “Which product has bad reviews?”).  
    - Optionally “report back” in natural language (e.g. daily digest).  
  - **Sub 1 (dashboard / admin):** Same model and backend as parent, or a dedicated “admin assistant” endpoint. Used inside Dashboard-react; can use the same API as parent.  
  - **Sub 2 (frontend):** Current `lavitur-ai-server` — customer-facing, product search and basic help only; no access to admin data.

**Ways to implement:**

- **Option A — Single AI service, two “modes”**  
  - Keep one service (e.g. extend `lavitur-ai-server` or move AI into Backend).  
  - Two entry points or headers:  
    - `POST /api/ai` — public or optional auth; system prompt = customer concierge (current behavior).  
    - `POST /api/admin/ai` — **admin-only** (Bearer + requireAdmin); system prompt = parent/dashboard AI with access to admin context (you pass in summary of notifications, metrics, or let the backend inject them).  
  - Parent and dashboard share the admin endpoint; frontend keeps using `/api/ai`.

- **Option B — Two codebases**  
  - Frontend: current `lavitur-ai-server` (customer only).  
  - Backend: new admin AI routes (e.g. in Backend) that call OpenAI with admin context and a “parent” system prompt.  
  - Dashboard calls Backend `POST /api/admin/ai` with conversation history; Backend adds context (recent orders, alerts, low stock) and returns reply.

**Recommendation:** **Option B** is clearer and more secure: admin AI lives in Backend (behind `verifySupabaseToken` + `requireAdmin`), frontend AI stays in `lavitur-ai-server` (no admin data). “Parent” and “dashboard” AI can be the same endpoint with the same system prompt; you can later add a separate “daily report” or scheduled summary if you want.

**Tech:**  
- **Backend:** New route `POST /api/admin/ai`; controller that:  
  - Builds context from Supabase (e.g. last 24h orders, products with low stock, recent negative reviews, pending products).  
  - Calls OpenAI (or your preferred model) with a system prompt like “You are the admin assistant for Lavitúr. You have access to the following context: …”.  
- **Dashboard:** New “AI command” or “Assistant” panel that talks to `POST /api/admin/ai` with Bearer token.  
- **Frontend:** No change; keep using `VITE_AI_API_BASE` → `lavitur-ai-server` for customer AI.

---

## 4. Approach — How to Do It Step by Step

### Phase 1 — Foundation (notifications and status)

1. **Database**  
   - Add table `admin_notifications` (e.g. `id`, `type`, `title`, `body`, `read`, `meta` JSONB, `created_at`).  
   - Optional: `admin_notification_preferences` (e.g. your user id, email_on_new_order, email_on_low_stock, etc.).

2. **Backend**  
   - `GET /api/admin/notifications` — list (and mark read).  
   - `PATCH /api/admin/notifications/:id/read`.  
   - From existing flows, **insert** notifications when:  
     - Order created → type `new_order`.  
     - Product status set to “pending” or “draft” for review → type `new_product_to_review` (if you have an “employee submitted” flow).  
   - Add a **scheduled or on-demand** check: negative reviews (e.g. `product_reviews` where rating ≤ 2 and created in last 24h), low stock (products where `stock` &lt; threshold); insert notifications for those.  
   - Expose `GET /api/admin/server/status` that returns backend health and, if you want, AI server health (Backend calls AI health URL).

3. **Dashboard-react**  
   - Notifications bell + list (and optional Realtime subscription).  
   - “Status” or “Server” page that calls `/api/admin/server/status`.

### Phase 2 — Server control (restart)

1. Get your host’s (e.g. Render) API key and deploy/service IDs.  
2. Backend: `POST /api/admin/server/restart-backend` (and optionally `restart-ai`) that call the host API.  
3. Dashboard: “Restart backend” / “Restart AI” buttons that call those endpoints (with confirmation).  
4. Rate-limit and audit (e.g. log who triggered restart).

### Phase 3 — Admin / parent AI

1. Backend: `POST /api/admin/ai` with body `{ message, conversationHistory }`.  
2. Controller: load context (recent orders, low stock, negative reviews, pending products); build system prompt; call OpenAI; return `{ reply }`.  
3. Dashboard: new page or panel “AI Assistant” that chats with `/api/admin/ai`.  
4. Optionally: scheduled job (cron or Supabase Edge) that once a day builds a summary and either stores it as a notification or sends you an email.

### Phase 4 — Optional extras

- Email sending for high-priority notifications (Resend/SendGrid + Backend or Edge Function).  
- Mobile push (PWA + FCM or native app) for instant alerts.  
- Worker that actually runs `maintenance_jobs` (by `job_key`) so your existing “database jobs” API does something when you enqueue a job.

---

## 5. Security — Making It as Secure as Possible

### 5.1 Auth and access

- **Admin only:** Every new endpoint for notifications, server control, and admin AI must sit under `/api/admin/*` so they get `verifySupabaseToken` + `requireAdmin`. No public access.  
- **Tokens:** Keep using Supabase JWT; short-lived access token; refresh only server-side or via Supabase client. Don’t put admin tokens in localStorage in a way that’s exposed to non-admin users.  
- **Dashboard:** Already guarded; ensure any new admin app (PWA or native) uses the same token flow and only ever sends tokens to your Backend (and Supabase), not to third parties.

### 5.2 Notifications and data

- **RLS / API only:** Prefer Backend (with service role) to read/write `admin_notifications`; don’t expose that table to anon key. If you use Realtime, use a channel that only authenticated admins can subscribe to (e.g. after verifying JWT in a Supabase custom access token or by only subscribing from Backend and pushing to Dashboard via your API).  
- **PII:** Don’t put raw customer PII in notification body if it’s stored in a table that might be exposed later; use “Order #1234” instead of full name in plain text if you’re worried.  
- **Audit:** Log who read/dismissed notifications and who triggered restarts (e.g. `req.userId` in Backend and store in an `audit_log` or reuse existing security events if you have them).

### 5.3 Server control (restart)

- **Secrets:** Render (or host) API key must live only in Backend env, never in frontend or in repo.  
- **Rate limiting:** Max 1–2 restarts per 5–10 minutes per admin; return 429 otherwise.  
- **Confirmation:** Dashboard should require an explicit “Yes, restart” (and optionally a reason or 2FA) before calling the restart endpoint.  
- **Least privilege:** If the host allows, use an API key that can only “restart” and not delete or change billing.

### 5.4 AI

- **Admin AI:** Only under `/api/admin/ai`; validate Bearer and requireAdmin. Don’t expose admin context to the frontend AI.  
- **Frontend AI:** Keep `lavitur-ai-server` without admin routes; optionally add rate limiting or CORS restricted to your frontend origin so only your site can call it.  
- **Secrets:** OpenAI (or other provider) API key only in Backend (and in AI server env); never in client.  
- **Context injection:** Build admin context in Backend from Supabase (service role); never send raw DB dumps to the client; only the model’s reply goes back.

### 5.5 General

- **HTTPS only** in production for Backend, Dashboard, and AI server.  
- **CORS:** Keep strict origins (dashboard and frontend domains only); don’t use `*` for admin or AI.  
- **Dependencies:** Regularly update Backend and AI server deps; run `npm audit`.  
- **Env:** All secrets in env (Supabase keys, OpenAI, Render API key); use a `.env.example` without values and document what’s needed.

---

## 6. Summary Table

| Goal | Where it lives | Tech / approach |
|------|----------------|------------------|
| See backend status | Backend + Dashboard | `GET /api/admin/server/status`; Dashboard “Status” page |
| New order alerts | Backend + Supabase | Insert into `admin_notifications` on order create; Dashboard (and Realtime) |
| Negative review alerts | Backend (job or on-demand) | Query `product_reviews` (e.g. rating ≤ 2); insert notifications |
| Low stock alerts | Backend (job or on-demand) | Query products where stock &lt; threshold; insert notifications |
| New products to review | Backend | When product status = pending/draft (or employee flow), insert notification |
| Server restart | Backend + host API | `POST /api/admin/server/restart-*` calling Render (or PM2 script) |
| Parent / dashboard AI | Backend | `POST /api/admin/ai` with context; Dashboard “AI Assistant” panel |
| Frontend (customer) AI | lavitur-ai-server | Keep current `/api/ai`; no admin data |

You can do all of this incrementally: start with notifications and status in the existing Dashboard and Backend, then add server control and admin AI, then harden and add email/push as needed.
