# Salon — Marketing site

Public marketing site for the Salon Management product.

Stack: **Vite + React 18 + TypeScript + Tailwind + react-router + Framer Motion**.

## Pages
- `/` — Home (hero, features bento, testimonials, pricing preview, CTAs)
- `/features` — 12 feature groups with sticky sub-nav
- `/pricing` — 3 tiers + currency toggle (INR/USD/GBP/AED) + monthly/annual + FAQ + add-ons
- `/about` — Founder story + values + company card
- `/blog` — Categorised post list + featured post
- `/blog/:slug` — Post detail
- `/contact` — Form + WhatsApp/Email/Phone cards

## Run locally
```bash
npm install
npm run dev
```
Opens at http://localhost:5173.

## Build
```bash
npm run build      # → dist/
npm run preview    # local preview of the built site
```

## Deploy to Vercel
1. Create a new Vercel project with **root directory = `marketing`**
2. Vercel auto-detects Vite. Build: `npm run build`. Output: `dist`.
3. `vercel.json` in this folder already handles SPA rewrites.
4. Recommended domain: your marketing root (e.g. `aveoninfotech.com`) with the app at `app.aveoninfotech.com`.

## What to edit
- **Blog posts** — `src/content/posts.ts`. Add entries to the array.
- **Pricing** — `src/pages/Pricing.tsx` (`CURRENCIES` + `TIER_FEATURES` at top).
- **Testimonials** — `src/pages/Home.tsx` (`TESTIMONIALS` at bottom).
- **Features** — `src/pages/Features.tsx` (`GROUPS` at top).
- **Brand tokens** — `tailwind.config.js` (colors + fonts).
- **Trial URL** — search for `APP` constant in `Home.tsx` / `Features.tsx` / `Pricing.tsx`.

## Design system
- Fonts: Fraunces (display) + Inter (sans) via Google Fonts
- Colors: brand red · cream · charcoal · sage accent
- Corner radius: 16–24px on cards, 999px on chips/buttons
- Shadows: `soft` and `pop` custom tokens
- Motion: Framer Motion (hero fade-in, hover-tilt on cards)

## Roadmap
- MDX blog engine (currently a typed array — swap later)
- Server-side contact form via Resend / SendGrid (currently `mailto:` fallback)
- Regional landing pages for SEO (`/salon-software-chennai`, etc.)
- Case-study video embeds

---

© Aveon Infotech Private Limited
