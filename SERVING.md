# How to run the Lavitúr site

## Where the progress lives

- **Static site (Frontend + admin-panel)** – This is where the recent fixes live: shop loading products, profile page, login, API base config, admin product actions (Submit/Publish/Archive), token refresh. Use this for the “full” experience.
- **React app (frontend-react)** – Same UI idea, but a separate codebase. It uses the same Backend API (with a dev proxy). Use it if you prefer the React version.

---

## Option 1: Static site (recommended – has all progress)

1. **Start the Backend** (required for shop, profile, admin):
   ```bash
   npm run backend
   ```
   (Runs `Backend` on **http://localhost:5000**.)

2. **Serve the static site** (Frontend + admin):
   ```bash
   npm run serve
   ```
   Opens on **http://localhost:5501**.

3. **Open in browser:**
   - Main site: **http://localhost:5501/Frontend/index.html**
   - Shop: **http://localhost:5501/Frontend/shop.html**
   - Profile / Login: from the main site
   - Admin: **http://localhost:5501/admin-panel/index.html**

---

## Option 2: React app

1. **Start the Backend** (same as above):
   ```bash
   npm run backend
   ```

2. **Start the React app:**
   ```bash
   npm run react
   ```
   Vite runs on **http://localhost:3000** and proxies `/api` to the Backend.

3. Open **http://localhost:3000** in the browser.

---

## Quick reference

| What you want | Command | URL |
|---------------|---------|-----|
| Static site (all progress) | `npm run serve` | http://localhost:5501/Frontend/index.html |
| Admin panel | (after `npm run serve`) | http://localhost:5501/admin-panel/index.html |
| React app | `npm run react` | http://localhost:3000 |
| API | `npm run backend` | http://localhost:5000 |

Always run the **Backend** when using the shop, profile, or admin.
