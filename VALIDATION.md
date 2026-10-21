# Validation — fresh market refresh

Checked on 21 October 2026 using Node.js 24.

## Verified locally

- Production build: TypeScript and Vite.
- 12 Node/jsdom tests: cart corruption handling and limits; sample total calculations; checkout validation; saved-list and receipt validation; search/filtering; persistent bag; checkout and sample receipt creation; image and offline recovery; deep product navigation and missing-route recovery; keyboard dialog focus and unavailable-product controls.
- Local self-hosted WebP fruit imagery and Manrope WOFF2 font, with the font's OFL license included.
- Production JavaScript split into application, React, GSAP, UI motion and smooth-scrolling chunks.

## Browser verification limitation

The connected browser timed out while initializing during this refresh. Earlier managed-browser access in the task was blocked by environment policy. No browser screenshots, device lab results, frame-rate measurements, or successful visual QA are claimed.

The component tests use the actual React controls with reduced motion. They do not measure browser layout, pointer animation, sticky positioning, ScrollTrigger geometry, real focus traversal by a screen reader, or mobile rendering.

## Deployment checks

Vercel configuration serves `/shop` and all six valid product URLs through the SPA. Unknown direct URLs use the custom `404.html` with HTTP 404. The React application also renders a missing-page view for unknown in-app navigation.

After deployment, verify HTTP status codes for the homepage, shop, product routes, missing routes, the local font, and static assets. Vercel's deployment status and build logs establish build success; they do not replace visual QA.

## Demo boundaries

Payments, account authentication, real delivery coverage, fulfillment, inventory and newsletter delivery are not connected. Every checkout is labeled as a demo. Contact/address form values are held in memory only while open; stored demo receipts contain product IDs, quantities, an estimated total, creation time and a demo ID. Sample shipping and discount rules are explicitly labeled.

Before a real store launch, replace or commercially license demo fruit assets, supply approved policies and contact channels, and connect server-validated stock, prices, tax, shipping, authentication and a payment provider.
