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

Deployment and browser verification results will be recorded after publication.
