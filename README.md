# Everbright Uniforms — website

Cinematic catalogue website for **Everbright Uniforms** and its three divisions:
EVERBRIGHT UNIFORMS, EVERBRIGHT POLICE STORE and EVERBRIGHT FIRE AND SAFETY.

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · GSAP 3 + ScrollTrigger · Lenis · WebGL (hand-written shader) ·
React Router 7 · lucide-react · self-hosted Cormorant Garamond + DM Sans.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Production build: `npm run build`, then `npm run preview`.

## Configure business details

Create `.env.local` in the project root (or edit `src/config/contact.ts`):

```
VITE_WHATSAPP_NUMBER=9715XXXXXXXX        # international format, digits only
VITE_MAPS_URL=https://maps.app.goo.gl/... # official store location
VITE_STORE_ADDRESS=...
VITE_CONTACT_EMAIL=...
VITE_CONTACT_PHONE=...
VITE_INSTAGRAM_URL=...
VITE_FACEBOOK_URL=...
VITE_LINKEDIN_URL=...
```

Restart `npm run dev` after editing. Until a value is set, the related buttons are shown **disabled with a
"pending" note** — nothing links to a fake destination.

Brand copy (About, Why Everbright, Contact text), the logo path and whether review-flagged products are shown
live in `src/config/brand.ts`. Copy marked `EDITABLE` is neutral starter text that makes no claims about
history, certifications or statistics.

## Catalogue data pipeline

```
reference pdfs/            original PDFs (read only)
scripts/extract_catalog.py PDF → cropped WebP images + src/data/products.json + contact sheets
scripts/build_reports.py   reports/pdf-extraction-report.md, reports/product-review-report.md
```

Re-run with `python scripts/extract_catalog.py && python scripts/build_reports.py` (needs `pymupdf` and
`pillow`). Product names are transcribed in the `CATALOGUE` section of the script — add new PDFs there.

Images: `public/catalog/<division>/<category>/<product-id>/<product-id>-NN.webp`
(`-01` front/main, `-02` back, `-03` front + back, `-04` details).

## Backend readiness

Components only talk to `src/services/catalog` through the `CatalogSource` interface. Set
`VITE_CATALOG_SOURCE=api` and `VITE_API_BASE_URL=https://…` to load `GET /products` (same shape as
`products.json`) instead of the local file. Enquiry messages are built in `src/lib/enquiry.ts`.

## Structure

```
src/
  components/
    animations/  TextileBackground (WebGL satin), TextReveal, Reveal/ImageReveal, ScrollProgress, Cursor
    layout/      Navbar, MobileMenu, Footer, Wordmark
    products/    ProductCard, DivisionCatalogue, ProductGallery, ProductDetail, ProductOverlay
    sections/    Hero, About, DivisionsIndex, DivisionSection (Police / Uniform), ProtectiveBags, WhyEverbright, Contact
  config/        brand.ts, contact.ts
  context/       CatalogContext (data-access hook)
  data/          products.json (generated), categories.ts, navigation.ts
  hooks/         useSmoothScroll (Lenis), useReducedMotion, useSectionNav
  lib/           enquiry (WhatsApp / Maps), gsap, introState
  pages/         Home, ProductPage, NotFound
  services/      catalog sources (local JSON / API)
reports/         extraction report, review report, image manifest, contact sheets, design references
```

## Routes

- `/` — home page with all sections.
- `/uniforms`, `/police-store`, `/fire-and-safety` — one page per division (catalogue + ordering).
- `/products/:id` — opens as a full-screen overlay from the catalogue (shareable URL); loads as a standalone
  page when visited directly.

## Accessibility & motion

Keyboard: `Esc` closes the product view, `←` / `→` move through the gallery, focus is trapped in the dialog and
returned to the card. `prefers-reduced-motion` disables smooth scrolling, the intro and scroll animations and
freezes the satin background (append `?motion=reduced` to test). The WebGL background pauses off-screen and
renders at reduced resolution on phones.
