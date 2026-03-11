# Home page content blocks — seed guide

The storefront home page is driven entirely by **content blocks** with **Page = Home**. Create these in Dashboard → Content Management, set **Page** to **Home**, and order them with the desired **Sort order** (and drag to reorder).

## Image paths (frontend-react/public)

Use these paths in **media_url** or in **body** JSON so images load from the frontend’s public folder.

**Slideshow** (create folder if missing: `frontend-react/public/images/slideshow/`):

- `/images/slideshow/feature1.png`
- `/images/slideshow/feature2.png`
- `/images/slideshow/feature3.png`
- `/images/slideshow/Womenswear.png`
- `/images/slideshow/Menswear.png`
- `/images/slideshow/Niche.png`

**Examples** (already present):

- `/images/examples/streetwear girl.jpeg`
- `/images/examples/streetwear men.jpeg`
- `/images/examples/Formal Girl.jpeg`
- `/images/examples/formal men.jpeg`

Video (if you use a banner with video):

- `/videos/background vid.mp4`

---

## Block types and example payloads

### 1. Hero (carousel + title + tagline + CTA)

- **Type:** Hero  
- **Page:** Home  
- **Title:** e.g. `Lavitúr`  
- **Body:** JSON with `tagline` and `slides` (array of image URLs):

```json
{
  "tagline": "Grace in Grit",
  "slides": [
    "/images/slideshow/feature1.png",
    "/images/slideshow/feature2.png",
    "/images/slideshow/feature3.png"
  ]
}
```

- **CTA label:** e.g. `Discover the Collection`  
- **CTA URL:** e.g. `/shop`

---

### 2. Collections (featured collection grid)

- **Type:** Collections  
- **Page:** Home  
- **Title:** e.g. `Featured Collections`  
- **Body:** JSON array of `{ "slug", "label", "img" }` (optional: `url` to override link):

```json
[
  { "slug": "womenswear", "label": "Women's wear", "img": "/images/slideshow/Womenswear.png" },
  { "slug": "menswear", "label": "Men's wear", "img": "/images/slideshow/Menswear.png" },
  { "slug": "niche", "label": "Niche Line", "img": "/images/slideshow/Niche.png" }
]
```

---

### 3. Homepage section (editorial text)

- **Type:** Homepage section  
- **Page:** Home  
- **Title:** e.g. `Timeless Craft. Modern Edge.`  
- **Body:** Paragraph text, e.g.  
  `Lavitúr fuses heritage tailoring with contemporary streetwear. Each piece is designed for those who embrace both refinement and authenticity.`

---

### 4. Banner / Video hero

- **Type:** Banner  
- **Page:** Home  
- **Title:** e.g. `Our Story`  
- **Body:** e.g. `Discover the roots of Lavitúr: Home of Luxury Streetwear where tradition meets the streets.`  
- **Media URL:** video or image URL, e.g. `/videos/background vid.mp4`  
- **CTA label:** e.g. `Learn More`  
- **CTA URL:** e.g. `/about`

---

### 5. Split (e.g. Women / Men tiles)

- **Type:** Split (e.g. Women / Men)  
- **Page:** Home  
- **Body:** JSON array of two tiles `{ "img", "label", "url" }`:

```json
[
  { "img": "/images/examples/streetwear girl.jpeg", "label": "Women", "url": "/shop?category=womenswear" },
  { "img": "/images/examples/streetwear men.jpeg", "label": "Men", "url": "/shop?category=menswear" }
]
```

---

### 6. Top Picks (heading only; products come from API)

- **Type:** Top Picks heading  
- **Page:** Home  
- **Title:** e.g. `Curated for You`  
- **Body:** leave empty. The section still pulls products from the products API.

---

### 7. Newsletter

- **Type:** Newsletter  
- **Page:** Home  
- **Title:** e.g. `Join the House`  
- **Body:** e.g. `Subscribe for exclusive launches, early access and style inspiration.`  
- The email form is fixed in the frontend; only title and body are editable.

---

## Migration

If the `content_blocks` table already existed before the **page** column was added, run:

- [supabase-content-blocks-page-migration.sql](supabase-content-blocks-page-migration.sql)

Then create the blocks above in Content Management with **Page = Home** and the desired order.
