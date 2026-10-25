> **25 October update:** See [UPGRADE_REPORT.md](UPGRADE_REPORT.md) for the prepared Tropical Feast account/Neon/WhatsApp upgrade, verified ₹149 / 200 g defaults, location-based delivery, migration instructions and actual test limits. Older entries below describe earlier deployments. This upgrade has not been published.

# Owner configuration and launch checklist

Production origin verified in this task: https://fruty-fawn.vercel.app. Canonical source: https://github.com/krishna3251/fruty.

Copy `.env.example` to an ignored local `.env.local` for local builds, or set the same public values in Vercel, then rebuild. VITE_ variables are public: never store secret keys in them.

| Value                    | Required input                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| VITE_PUBLIC_SITE_URL     | Current real HTTPS production origin, with no path/query. Set this when moving to a custom domain. |
| VITE_BUSINESS_NAME       | Verified legal/trading name.                                                                       |
| VITE_CONTACT_EMAIL       | Monitored support/privacy mailbox.                                                                 |
| VITE_CONTACT_PHONE       | Real support telephone.                                                                            |
| VITE_CONTACT_ADDRESS     | Real physical business address.                                                                    |
| VITE_GA_MEASUREMENT_ID   | Optional real GA4 measurement ID (G-…). Leave empty to keep tracking off.                          |
| VITE_NEWSLETTER_ENDPOINT | Optional absolute HTTPS service endpoint. Leave empty to keep submissions disabled.                |

The newsletter API contract is POST JSON `{ "email": "..." }` with a 12-second timeout. Only a 2xx response containing JSON `{ "subscribed": true }` creates the confirmation marker. The real service must validate email and consent server-side, enforce rate limits/abuse controls, implement appropriate double-opt-in where needed, allow only the production origin via CORS, and define provider identity, retention and deletion procedures. No arbitrary endpoint or credentials have been fabricated. This repository contains no newsletter backend.

GA4 loads only after explicit analytics consent. No tag/request is made before consent. Page paths exclude query/fragment data; no checkout/form contents are tracked. Disable GA4 enhanced-measurement page-history events in the property to avoid duplicate SPA views; application code sends its own page_view events. Verify in GA4 DebugView/Tag Assistant using a test property, test reject/accept/revoke, and inspect the network/cookies before enabling production collection. No live measurement was tested without an ID. Consent expires after 180 days; legal requirements and the notice must be reviewed for the business's actual markets.

The privacy page describes actual browser storage, demo checkout fields, optional newsletter and analytics behavior. The terms are an editable pre-launch template. Supply legal identity, jurisdiction, support hours, real commercial policies and obtain legal review before sales. Do not present demo receipts as orders/invoices.

Still required for real commerce: server-side catalogue/price/stock validation; orders and durable records; secure payment-provider integration and verified webhooks; delivery/serviceability/tax calculations; returns/cancellation/refund procedures; production monitoring and incident/contact processes. Replace or license the demo fruit imagery for commercial use.

Verification: `npm ci && npm run verify`. Build-generated metadata tests require a current build. No lint configuration exists; format checks are not lint. Check 320/360/390/768/1024/1440px views, keyboard and screen-reader navigation, motion preference changes, sticky CTA/form overlaps and console errors in real browsers before commercial launch.

## Pickle collections — 23 October 2026

`src/data/pickles.ts` is the single source of truth for four supplied promotional product entries. The existing sample fruit catalogue/cart is unchanged. Pickle price, size, ingredient list and stock status remain `null`/unconfirmed; no unpriced pickle can enter the fruit checkout. The two cucumber products have distinct IDs and collection metadata. Seller relationships/shared ownership are not established.

Routes: `/pickles`, `/collections/fermented-pickles`, `/collections/tropical-feast`, and `/products/{fermented-cucumber-pickle,fermented-pale-vegetable-pickle,tropical-pineapple-pickle,tropical-cucumber-pickle}`. Build-generated metadata and sitemap include all seven new pages.

Set **`VITE_TROPICAL_FEAST_DM_URL`** to the supplier's verified public HTTPS direct-message URL, then rebuild/redeploy. This public value is only used for Tropical Feast. Blank, non-HTTPS or credential-bearing values leave the DM action unavailable with a clear explanation. No message is sent automatically; visitors follow the external link to enquire. Website contact details are not silently reused as a supplier's identity. Confirm the destination and seller authority before configuring it. External DM provider privacy/retention practices must be disclosed if this channel is enabled.

Fermented Pickles has no confirmed ordering method or service area; its detail pages explain the missing supplier contact. Hyderabad-only applies **only** to Tropical Feast. No DM, phone number, address, live stock or price has been invented.

### Owner content still required

- Actual separate product photographs and permission to publish them; no attachment was available in the coding session. Six self-contained SVG jar/tabletop illustrations are explicitly marked as illustrations/photos pending. They are visual placeholders, not evidence of packaging, ingredients or actual product appearance. Replace each `image`/`imageAlt` in the data source once verified photography arrives; replace scene SVGs in `Pickles.tsx` with approved scene images.
- Exact identity of the pale vegetable pickle; do not rename it until verified.
- Verified prices in INR, jar sizes, ingredients/allergens, stock, storage/shelf life, supplier identity and commercial terms for each collection.
- Tropical Feast's verified DM URL, and a separately verified Fermented Pickles order/contact method.
- Fermented Pickles’ “ZERO OIL / ZERO MASALA” wording is attributed to the supplied promotion and accompanied by an ingredient-confirmation notice. It is not a verified ingredient list. Health/antioxidant/gut-related claims are not published. Confirm supporting documentation and applicable requirements before expanding these claims.

Supplying a price alone does not enable pickle checkout. A real ordering/payment integration needs supplier-specific fulfilment, prices, stock and server-side validation; preserve the explicit enquiry-only boundary until implemented and verified.

## Pickle-first reconstruction

See `RECONSTRUCTION.md` for the current primary architecture. `/shop` now means pickles. The old fruit demo is retained at `/fruit-demo`, `/fruit-story` and its existing six product URLs, all noindex and excluded from the sitemap. The primary enquiry list stores only known pickle IDs under `fruity-pickle-selection-v1`; it does not place orders. The copy action writes only a product enquiry template to the visitor's clipboard after an explicit click. The public catalogue still needs supplier prices, ingredients, stock, real photos and contacts before real commerce can be enabled.
