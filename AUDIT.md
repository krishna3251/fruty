# Production audit — 22 October 2026

Repository: `krishna3251/fruty`. Production: `https://fruty-fawn.vercel.app`.
Baseline: `782f621`. React 19, TypeScript, Vite, Tailwind + CSS, custom History API routes, GSAP/ScrollTrigger, Lenis, Framer Motion, local catalogue and browser-persisted cart. No backend, payment, inventory, sign-in or newsletter service exists.

## Baseline requirement checklist

| #   | Requirement       | Baseline finding                                                                                                       |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Custom 404        | Implemented correctly: branded React and static fallback; existing live checks returned 404.                           |
| 2   | Above-fold CTA    | Partially implemented: functional hero shop link; actual device positioning unverified.                                |
| 3   | Page titles       | Partially implemented: client title changes; raw product/shop HTML duplicated home title.                              |
| 4   | Descriptions      | Missing: one shared description.                                                                                       |
| 5   | Social previews   | Missing: no Open Graph or Twitter tags/card.                                                                           |
| 6   | Favicon           | Partially implemented: SVG only; exists.                                                                               |
| 7   | robots.txt        | Missing.                                                                                                               |
| 8   | Sitemap           | Missing.                                                                                                               |
| 9   | Alt text          | Partially implemented: most correct; decorative image failures become noisy; journal uses direct images.               |
| 10  | Breakpoints       | Partially implemented: responsive CSS exists; no real-browser visual verification.                                     |
| 11  | Sticky mobile CTA | Partially implemented: PDP action sticky; no safe-area padding or home visibility adaptation.                          |
| 12  | Loading           | Partially implemented: grid state, checkout busy state; missing image-loading feedback.                                |
| 13  | Forms             | Requiring correction: newsletter reports “on the list” without submission. Checkout/PIN correctly identified as demos. |
| 14  | Thank-you         | Missing: no genuine submission confirmation route; existing checkout receipt is explicitly a demo.                     |
| 15  | Privacy           | Partially implemented: short modal, no dedicated page or complete storage details.                                     |
| 16  | Terms             | Missing.                                                                                                               |
| 17  | Cookie consent    | Not applicable to existing tracking (none); configuration/management absent for future analytics.                      |
| 18  | Analytics         | Missing: no provider or configuration. No measurement ID supplied.                                                     |
| 19  | Contact           | Partially implemented: placeholder modal, no verified business identity/contact fields.                                |

## Existing surfaces inspected

Home hero and shop links; four pinned fruit chapters; category/search/sort; six product quick views and product routes; cart drawer, quantities, undo and empty state; checkout details/review/coupon/demo completion; wishlist; device-local demo receipt history; story, reviews marked fictional, newsletter, FAQ and PIN format checker; footer informational modals; motion control; offline and application recovery screens. Routes: `/`, `/shop`, six `/products/:id`, static and client 404. Forms: product search, checkout, coupon, PIN checker, newsletter.

## Verification boundaries

Build, formatting and Node/jsdom tests are executable. No lint script is configured; formatting is not lint. Current browser controls are unavailable/previously blocked; no device screenshots or frame-rate assertions will be claimed. Commerce remains a demonstration until owner-configured backend services are implemented and verified. Fruit image commercial rights and real policies/contact details remain launch requirements.

## Implementation outcome

| #     | Final state and evidence                                                                                                                                                                                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Retained branded static/client 404 and HTTP status routing.                                                                                                                                                 |
| 2     | Preserved existing hero CTA; real shop destination retained. Device fold placement requires visual QA.                                                                                                      |
| 3–4   | Unique title/description for all 11 public pages in generated HTML and client navigation; automated build-output checks.                                                                                    |
| 5     | Local 1200×630 branded PNG; absolute OG/Twitter tags and dimensions; asset inspected and checked.                                                                                                           |
| 6     | SVG, 16/32px PNG, Apple icon, manifest icons exist.                                                                                                                                                         |
| 7–8   | Build generates robots/sitemap from the actual production origin or VITE_PUBLIC_SITE_URL; excludes confirmation and errors.                                                                                 |
| 9     | Meaningful alts retained; decorative fallback is now aria-hidden; loading area feedback added.                                                                                                              |
| 10    | Existing phone/tablet/desktop CSS retained, touch target/safe-area refinements inspected. Visual overflow/console/frame-rate QA remains unverified.                                                         |
| 11    | Home sticky CTA uses intersection visibility, form focus and dialog state; PDP sticky action includes safe area. Visibility branches tested.                                                                |
| 12    | Existing checkout busy state retained; newsletter busy/timeout/failure and image-loading states added.                                                                                                      |
| 13    | Newsletter input validation and truthful unavailable state; configured endpoint must return verified success; failed input is retained. No backend exists to audit server validation.                       |
| 14    | Dedicated noindex confirmation page gated by a session marker created only after successful newsletter API response; direct visit cannot claim signup. Commerce demo stays explicitly labeled.              |
| 15–16 | Dedicated implementation-based privacy notice and editable pre-launch terms. Owner identity and legal review remain required.                                                                               |
| 17    | No optional banner when no tracker exists; preference management always accessible. Configured GA4 requires opt-in; equal accept/reject controls, no preselected analytics, expiry and revocation included. |
| 18    | GA4 configuration path and consent-gated loader, deduplicated page views, safe product/CTA/signup events. No real ID supplied: live collection/provider delivery unverified. No purchase events invented.   |
| 19    | Dedicated contact page renders validated mailto/tel links only for configured values. Missing identity/email/phone/address remain clearly labeled.                                                          |

## Additional independent findings and corrections

- Raw SPA HTML previously duplicated metadata across routes; per-route HTML heads now fix social-preview and canonical discovery without replacing the existing application.
- Removed a fake newsletter “on the list” success state.
- Normalized trailing-slash routes to avoid a valid static page rendering a client 404.
- Protected decorative image failures from screen-reader noise.
- Added keyboard focus placement after page navigation, and guarded click targets.
- Production and full dependency audits reported zero known vulnerabilities at the time checked.
- Existing third-party fruit-image commercial rights remain unverified; see README attribution.

## Readiness

Ready to deploy as an honestly labeled demonstration storefront after checks below. **Not ready to accept real orders.** Commercial launch requires real business/support details, approved policies, licensed imagery, backend stock/pricing/order/payment/delivery services, and real-device visual QA. Analytics and newsletter remain off until configured; their actual providers must be validated before collecting data.
