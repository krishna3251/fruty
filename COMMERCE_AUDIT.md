# Commerce reliability and SEO update — 24 October 2026

## Audit and implementation

| Area               | Baseline finding                                                             | Change / status                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cart email         | Native mailto depended on a configured device mail handler                   | Gmail web-compose redirect with encoded product draft, native email fallback and manual-send disclosure                                                                  |
| Basket             | Saved products had no quantities or subtotal                                 | Quantity controls (1–99), subtotal, validated persistent quantities, legacy migration and cross-tab updates                                                              |
| Search metadata    | Route metadata existed; product JSON-LD missing and catalogue URL duplicated | Initial-HTML and SPA Product, BreadcrumbList and WebSite JSON-LD; verified ₹200 prices; duplicate catalogue and trailing-slash redirects; nine canonical sitemap entries |
| Browser protection | Basic response headers existed                                               | CSP, HSTS, popup-compatible opener policy and cross-domain-policy restrictions added                                                                                     |
| Reliability        | JavaScript needed for all browsing                                           | No-JavaScript catalogue/enquiry fallback plus explanatory policy fallbacks; phones avoid downloading desktop pantry GSAP solely for parallax                             |
| Privacy            | Saved IDs disclosed                                                          | Quantity storage and external Gmail/WhatsApp draft handling disclosed; clear-data includes quantities                                                                    |
| Payments / stock   | No connected checkout or inventory service                                   | Preserved honest enquiry-only workflow; no fabricated transactions or availability                                                                                       |

## Files

- `src/lib/contact.ts`, `src/components/EmailEnquiry.tsx`: web email redirect and native fallback.
- `src/components/EnquiryList.tsx`, `src/context/PickleSelection.tsx`, `src/App.tsx`, `src/cinematic.css`: quantities, subtotal, basket count and UI.
- `src/lib/structuredData.ts`, `src/lib/seo.ts`, `src/components/PageMetadata.tsx`, `scripts/build-pages.ts`, `src/data/pickles.ts`: schema, metadata, canonical catalogue and no-JavaScript fallback.
- `src/components/Pickles.tsx`, `src/components/InformationPage.tsx`: working email routes and accurate disclosures.
- `src/hooks/usePantryMotion.ts`: defer desktop parallax module loading on phones; resizing remains supported.
- `vercel.json`: security headers and duplicate-URL redirects.
- `tests/commerce.test.ts`, `tests/store.test.ts`: redirect encoding, basket persistence, schema lifecycle and deployment configuration checks.

## Executed local verification

- `npm run verify`: production TypeScript/Vite build, 42 passing tests, Prettier check passed.
- `git diff --check`: passed.
- `npm audit --json` and production-only audit: zero reported vulnerabilities at execution time. This is not a penetration test or assurance against unknown vulnerabilities.
- Existing tests cover mobile muted autoplay, desktop/manual video fallbacks, reduced motion, enquiry and archived fruit-demo behavior.

## Research basis

Google Product structured-data guidance: https://developers.google.com/search/docs/appearance/structured-data/product-snippet

OWASP Secure Headers Project: https://owasp.org/projects/secure-headers-project/

OWASP CSP guidance: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

These informed accurate product schema and browser restrictions. Search rich results and rankings are not guaranteed.

## Owner requirements and limits

- Confirm jar sizes, ingredients/allergens, stock and legal seller identity/address; publish delivery charges/times, cancellation and refund terms before taking commercial orders.
- No payments, order verification, inventory backend or error-monitoring service was added. This is an enquiry catalogue, not a complete online checkout.
- Gmail needs the visitor’s Google sign-in; native email needs a mail handler. The site only prepares drafts and never sends automatically. Sending mail is intentionally not tested.
- Optional analytics still requires a configured measurement ID and consent. Search Console ownership, sitemap submission and Google rich-result validation require owner action.
- Future external newsletter endpoints must be added deliberately to CSP connect-src before enabling submissions; document the actual provider and retention policy.
- Contact destinations remain behind links, as requested. Both confirmed pickles remain ₹200; no new flavours or commercial claims were invented.

## Live verification

- Production deployment `01e77ad` reached READY on Vercel and is live at https://fruty-fawn.vercel.app.
- HTTP: homepage, shop, pineapple product, contact and privacy return 200; unknown route returns 404; `/pickles` returns 301 to `/shop`; `/shop/` returns 308 to `/shop`; sitemap contains nine URLs.
- Live HTML includes Product price 200 INR and breadcrumb JSON-LD. CSP, HSTS, nosniff and frame-denial headers are present.
- Browser: desktop basket quantity changes produced ₹600 for two pineapple jars and one cucumber jar; Gmail URL includes the correct full draft and opens a new tab. Native mail-app fallback is present. Reload preserved quantities and subtotal.
- Browser at 390 × 844: document width 390 with no horizontal overflow; drawer scrolls vertically and all enquiry actions remain reachable. Mobile hero video was muted, playing, readyState 4, with no native controls.
- Checked desktop product and basket flows showed no browser console errors. Exactly one Product schema script and the correct canonical were present on the product page.
- [Mobile enquiry basket screenshot](docs/enquiry-basket.jpg).
- External email delivery was not exercised; redirect construction and in-page destinations were verified without sending any message. No Lighthouse score, Google indexing, payment security or penetration-test result is claimed.

The site is ready as an enquiry catalogue. Full online commerce remains dependent on the business and backend requirements above.
