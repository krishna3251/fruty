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

## Production audit follow-up — 22 October 2026

Baseline checks passed before changes: build, format check, 12 tests; npm audit reported no known production vulnerabilities. The full dependency audit also reported zero known vulnerabilities.

Implementation verification: TypeScript/Vite plus static page-head generation; 19 Node/jsdom tests covering existing commerce behavior, per-page title/description uniqueness, canonical/OG/Twitter tags, icon/card existence, sitemap/robots contents, invalid-origin rejection, consent blocking and revocation, duplicate-page-view prevention, newsletter failure/input preservation and verified response gating, policy/contact routing, trailing slashes and mobile CTA visibility. Format check passes. No lint script exists.

Responsive work was inspected in CSS and tested for CTA visibility logic, form focus, reduced-motion code paths and safe-area rules. No browser, console, screenshot, screen-reader or frame-rate verification was possible in this environment. Real analytics collection and newsletter service delivery were not tested because no ID or endpoint was provided. No business identity or contact details were supplied.

The report in AUDIT.md distinguishes implementation, external configuration, and unverified visual behavior. This is deployable as a demonstration, not a live trading store.

## Pickle integration — 23 October 2026

Baseline: build, 19 tests and formatting passed before this change. After integration, TypeScript/Vite and 18 unique indexable page heads build successfully; 24 Node/jsdom tests cover the original fruit shop/cart/checkout plus null pickle commercial fields, collection separation, safe DM configuration, product/collection routes (including trailing slashes), search/filter/empty recovery and Hyderabad scoping. Existing fruit product records and cart model were not changed. Formatting passes; no lint script is configured.

The browser extension is now connected, but cannot reach the container's local Vite server (`ERR_CONNECTION_REFUSED`); the server itself starts with `--host 127.0.0.1`. Live browser verification will be performed against the deployed version where accessible. This paragraph does not claim device layouts or photographs were visually verified. No supplier DM value, actual product photography or verified commercial fields have been supplied. The illustration assets are explicitly placeholders; health and nutritional claims are omitted. Fermented Pickles’ supplied oil/masala wording is attributed to the promotion with an ingredient-confirmation notice.

### Live follow-up

Production checks passed for 15 HTTP URLs: the seven new pages, home/shop/mango, sitemap with 18 entries, two new SVGs and unknown collection/product URLs returning HTTP 404. All six new SVGs were parsed as valid XML with unique IDs and no external image dependencies.

Live Chrome QA covered home at 320×740, 390×844, 768×1024, 1280×800 and the default 1680px width. A joined hero line clipped on phones during the first pass; the mobile rule was removed and the deployed correction was rechecked at 320/390/768/1280px. No horizontal document overflow was measured at those sizes and the hero CTA stayed in the first viewport. Pickle catalogue and the longest product title were checked at phone/tablet/desktop widths without measured document overflow. The catalogue filter/search produced the correct Tropical Feast cucumber entry; product navigation and its enquiry-status anchor worked. Mobile navigation opened, keyboard Enter followed the Pickles link, the menu closed and focus moved to the page heading. The existing shop still rendered six fruit cards; its existing bag opened/closed with contents preserved. Captured console error logs were empty during this pass. Screenshot: `docs/pickle-home-desktop.jpg`.

This is responsive browser QA, not a physical-device lab, screen-reader audit or frame-rate benchmark. No supplier DM was sent, no real checkout transaction occurred, and actual photos/labels remain unverified. Final build, 24 tests and formatting passed after the phone correction; no package/dependency changes were introduced.
