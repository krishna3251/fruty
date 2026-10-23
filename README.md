# furity — Freshness, in full color.

A responsive fruit store concept built with React, Vite, TypeScript, Tailwind CSS, GSAP + ScrollTrigger, Framer Motion, and Lucide React. Inspired by the supplied pastel, floating-fruit campaign video, with an original brand and complete local shopping frontend.

## Run locally

Use Node.js **22.12+** (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://localhost:4173.

```sh
npm run verify  # build, 19 tests, and formatting checks
npm run build   # strict TypeScript check and production build
npm run preview # serve the production dist folder
npm run format:check
```

## Included

- Cream and forest-green editorial hero with photographic fruit cutouts.
- Four horizontal, scroll-scrubbed desktop chapters: mango, strawberry, blueberry, citrus. Fruit, oversized type, and satellites move independently; background colors interpolate continuously.
- GSAP contexts and matchMedia cleanup. Below 768px and with reduced motion, the showcase becomes four natural-flow scenes without pinning. Reduced motion disables idle floating and animated entrances.
- Search, category filters, price sorting, product details, origin and storage notes.
- Browser-persisted shopping bag, quantity controls, removal, totals, empty state, and demonstrative checkout.
- Bestsellers, seasonal berry collection, brand story, fictional demo reviews, and demo newsletter.
- Focus-trapped dialogs, Escape/backdrop dismissal, focus restoration, skip-to-shop link, labeled icon buttons, keyboard focus indicators, semantic sections, live cart notifications.
- Local WebP images (approximately 570 KB in total), reserved image areas, eager hero loading, and lazy images below the fold. No runtime third-party image requests, tracking, or video backgrounds.

## Project map

```text
src/App.tsx                    Store composition and shopping interfaces
src/components/Showcase.tsx     ScrollTrigger choreography
src/components/Modal.tsx        Shared accessible dialog/drawer
src/context/CartContext.tsx     Cart state and local persistence
src/context/cartModel.ts        Validated cart parsing and quantity rules
src/data/products.ts            Typed local sample catalogue, INR formatting
src/styles.css                 Responsive design and motion fallbacks
public/images/                 Optimized, self-hosted photographic cutouts
```

## Demo boundaries

**No payment, account, live inventory, fulfillment, newsletter service, or delivery service is connected.** Prices, origins, availability, and reviews are sample content. Checkout displays a review step and a clearly labeled demo completion; it neither requests payment details nor places an order. Newsletter email input is not transmitted or persisted. The cart uses the versioned `furity-cart-v1` localStorage key; invalid stored items are rejected. A sample maximum of 20 packs per item applies.

To connect a backend, replace the typed local product source with a catalogue API, validate stock and prices on the server, add delivery/tax calculation, and create payment sessions server-side with secrets in environment variables. Publish real policies and verified support details before launch.

## Image attribution and launch requirements

Fruit photography cutouts: **pngimg.com**. Images have been resized and converted to WebP; the website footer credits the source. These are demonstration assets: confirm the individual image license and obtain commercial rights or replace with licensed photography before operating a commercial store. Do not assume all image licenses are identical.

Original source URLs:

- Mango: https://pngimg.com/uploads/mango/mango_PNG9168.png
- Strawberry: https://pngimg.com/uploads/strawberry/strawberry_PNG2637.png
- Blueberries: https://pngimg.com/uploads/blueberries/blueberries_PNG74.png
- Orange slice: https://pngimg.com/uploads/orange/orange_PNG813.png
- Lemon: https://pngimg.com/uploads/lemon/lemon_PNG25192.png
- Avocado: https://pngimg.com/uploads/avocado/avocado_PNG15488.png

No external font service is required. Manrope is served locally, with Georgia for editorial accents.

## Validation status

See `AUDIT.md`, `PRODUCTION_SETUP.md` and `VALIDATION.md` for the 19-requirement audit, owner configuration and actual checks and environment limitations. Visual browser verification must be completed on desktop and mobile before production launch.

## Repository and deployment

Canonical source: https://github.com/krishna3251/fruty

The website brand remains **furity**. The repository is named **fruty**.

Build command: `npm run build`. Output directory: `dist`. No environment variables are required for this demo.

## Fresh market refresh

- Soft oat, sage, dusty rose, butter and powder-blue palette; local Manrope variable font (SIL OFL, see `public/fonts/OFL.txt`).
- Pointer parallax in the hero, fruit hover response, desktop Lenis wheel smoothing, continuous GSAP chapters, chapter navigation, reading progress and a decorative-motion pause control. Touch devices keep native scrolling; reduced-motion users receive natural-flow scenes.
- A dedicated `/shop`, six deep-linkable `/products/:id` pages, related products, persistent saved fruit, and product information tabs.
- Two-step guest checkout demonstration with field-specific validation, sample-detail autofill, transparent delivery estimates, a `FRESH10` demo discount, and local demo receipts. No contact data is persisted and no orders or payments are processed.
- Error boundary, offline banner, image fallback, app-level missing-page view, static HTTP 404 page, PIN-format checker and FAQs.
- Cart removal can be undone during the notification window.

Motion references: [GSAP quickTo](<https://gsap.com/docs/v3/GSAP/gsap.quickTo()/>), [Lenis](https://github.com/darkroomengineering/lenis), [reduced motion](https://web.dev/articles/prefers-reduced-motion). Checkout direction: [Baymard's checkout friction audit](https://baymard.com/blog/audit-checkout-flow-hidden-friction).

## SEO and configuration

The build generates route-specific HTML heads, robots.txt and sitemap.xml from the verified production origin or `VITE_PUBLIC_SITE_URL`. See `.env.example` and `PRODUCTION_SETUP.md` for business, newsletter and opt-in analytics configuration. Privacy, terms and contact are dedicated routes. No analytics loads or newsletter signup succeeds without the corresponding actual service configuration.

## The pantry edit: supplied pickle collections

The homepage now introduces **Fermented Pickles** and **Tropical Feast**, while preserving the fruit hero, cinematic showcase, sample catalogue and cart. `/pickles` provides searchable collection filters; two collection routes and four product routes use one structured source, `src/data/pickles.ts`. Unknown prices, jar sizes and ingredients are null, not made-up values. The pale vegetable variety stays explicitly unconfirmed. Hyderabad-only and optional direct-message ordering are scoped to Tropical Feast.

`src/components/Pickles.tsx` reuses existing buttons, image recovery, navigation and editorial typography, with responsive styles in `src/pickles.css`. The local SVG jar/tabletop artwork is labelled as illustrative pending real photography. No reference attachment was available in this session. See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#pickle-collections--23-october-2026) for the new public DM URL configuration and content handoff.
