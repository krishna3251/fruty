> **Latest V4 update (25 October 2026):** See [V4_IMPLEMENTATION.md](V4_IMPLEMENTATION.md) for the current audit, recovery/cart/mobile improvements and owner-confirmed ₹150 standard delivery. Historical release notes below describe earlier versions.

# Tropical Feast customer accounts and WhatsApp commerce

Local implementation prepared 25 October 2026 in the existing `krishna3251/fruty` project. Review branch: `feature/tropical-feast-neon-commerce`. **Published to GitHub main and Vercel after explicit user approval.** See [LIVE_RELEASE.md](LIVE_RELEASE.md) for the live verification and migration execution record. This report supersedes older price, delivery and account-scope statements in historical project notes.

## Audit and scope

The baseline was React 19, Vite 7 and TypeScript, existing CSS/Tailwind, GSAP/Framer Motion, Clerk, a private Vercel Blob catalogue/photo store and an owner gate. There were 61 passing automated tests. The two original flavours, supplied photographs, autoplay hero, optional Jar Lab, photo zoom, accessible dialogs, archived fruit demo, SEO routes, catalogue ETags and protected photo uploads were retained.

Missing: customer database schema, address book, cross-device cart, stored enquiries, owner enquiry/settings tools, automatic first signed-out visit offer. Outdated: ₹200/no-size products, flat ₹150 delivery, original public email, and privacy copy describing all carts as device-only. Neon Marketplace environment **names/targets only** were inspected in Vercel; no secret was printed or changed. GitHub main's package and branch were inspected through the connector; local base is `379c61c`.

## Implemented

| Requirement                    | Result                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed business information | Tropical Feast, Hyderabad, updated email redirect, supplied Instagram/hours/tagline; two seed products ₹149 / 200 g. Ingredients and stock remain unconfirmed.                                                                                                                                       |
| First-visit sign-in            | Shared Clerk provider waits for session readiness; signed-out visitors receive a dismissible split-photo modal. Guest preference is session-only, separate from real authentication and analytics. Signed-in visitors skip the offer; session expiry can offer sign-in again.                        |
| Guest browsing                 | Always accessible, including provider failure/timeout, cart and direct enquiries. No fake account flag.                                                                                                                                                                                              |
| Customer accounts              | Saved addresses, default selection, enquiry history/status, store-data deletion with typed confirmation. Existing Clerk security/profile controls retained.                                                                                                                                          |
| Cart sync                      | Account cart in Neon; guest cart local. Idempotent guest merge uses maximum per product rather than adding duplicates. Revision checks reject stale writes. Failed/conflicting saves show a reload action. Account carts are not copied into localStorage.                                           |
| Enquiry review                 | Current prices visible in cart before personal details, delivery fields, review, server-price snapshot, genuine saved-enquiry reference, explicit WhatsApp redirect. Failure retains details and offers a clearly labelled unsaved direct-message fallback.                                          |
| Delivery                       | Universal fee removed. No default delivery charge or final payable total. Optional owner-confirmed PIN areas/rates, free-delivery threshold and estimate; no supplied area/rate/timing is invented. Coverage remains unconfirmed for unmatched PINs.                                                 |
| Owner tools                    | Existing product/photo editor preserved, optional verified stock quantity added. Separate enquiries tab supports reference search/status filter, customer delivery details, WhatsApp link, manual confirmation, delivery/payment records and status history. Business settings have conflict checks. |
| Privacy/security               | Server-verified Clerk identities and owner gate, trusted-origin checks, parameterized SQL, bounded request bodies, persistent rate limits, account ownership filters, private no-store responses. No payment gateway.                                                                                |
| Design/mobile/SEO              | Existing warm cinematic design retained, Tropical Feast wordmark, compact shop intro, responsive account/review forms, updated cookie/policy copy, page/social/schema brand and noscript copy.                                                                                                       |

## Files

- `migrations/001_customer_commerce.sql`: additive, `tf_`-namespaced schema; atomic cart merge and default-address functions.
- `scripts/migrate.ts`, `scripts/sqlStatements.ts`: version/checksum migration runner; SQL splitting preserves function bodies, applies each migration transactionally.
- `scripts/upgrade-catalogue.ts`: explicit dry-run-first correction of only legacy original products; preserves deliberate owner edits and all additional products.
- `server/db.ts`, `server/customerAuth.ts`, `server/commerce.ts`: Neon access, identity/input guards, cart/address/enquiry/settings services and owner order updates.
- `api/customer.ts`, `api/enquiry.ts`, `api/business.ts`, `api/owner-orders.ts`: same-origin Vercel endpoints.
- `src/context/Session.tsx`, `Business.tsx`, `PickleSelection.tsx`: shared authentication, public settings and cart synchronization.
- `src/lib/business.ts`, `customer.ts`, `customerApi.ts`: structured business data, validation/types, delivery estimates/messages and request/error handling. Existing `catalogue.ts`, `config.ts`, `contact.ts`, `seo.ts`, `structuredData.ts` updated.
- `src/components/CustomerDashboard.tsx`, `AddressFields.tsx`, `EnquiryReview.tsx`, `OwnerOperations.tsx`: new customer/owner interfaces. Existing App, AccountPage, ClerkAccount, AdminPanel, EnquiryList, EmailEnquiry, InformationPage, PrivacyControls, Pickles, ShoppingConfidence, CinematicHero and PageMetadata updated.
- `src/commerce.css`, `src/main.tsx`: scoped visual additions, no replacement design system.
- `src/data/pickles.ts`, `server/productPage.ts`, `scripts/build-pages.ts`: verified catalogue defaults and SEO/fallback corrections.
- `.env.example`, `package.json`, `package-lock.json`: server-only database configuration and migration commands. New production dependency: `@neondatabase/serverless`; test-only: `@electric-sql/pglite`.
- `tests/customer-commerce.test.ts`, `tests/store.test.ts` and existing pricing/contact tests: database, security, session, cart and enquiry regression checks.
- `docs/tropical-hero-desktop.jpg`, `docs/tropical-shop-desktop.jpg`, `docs/tropical-cart-mobile.jpg`: local browser proof with fixture catalogue/public-settings responses; not a live deployment or authentication proof.

## Database model

| Table            | Purpose                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tf_customers`   | Internal UUID, unique Clerk identity, name, verified email, optional phone, timestamps.                                                                                                           |
| `tf_addresses`   | Customer-owned validated address JSON, including recipient/phone/street/locality/city/state/PIN/default. Atomic default changes, maximum 10 addresses.                                            |
| `tf_carts`       | Customer-owned product-ID/quantity JSON, revision, update time.                                                                                                                                   |
| `tf_cart_merges` | Per-customer idempotency keys for guest merge retries.                                                                                                                                            |
| `tf_orders`      | Enquiry reference, unique request ID, nullable customer, contact/address snapshot, item/price snapshots, subtotal, nullable delivery/total, status, manual payment records, revision and history. |
| `tf_business`    | Public business/delivery configuration with revision.                                                                                                                                             |
| `tf_rate_limits` | Short-lived hashed network/customer action counters.                                                                                                                                              |
| `tf_migrations`  | Version/checksum/application time, created by migration runner.                                                                                                                                   |

All API reads/mutations use the identity verified on the server, never a client customer ID. Guests cannot retrieve private enquiry records by reference. The existing catalogue remains in Blob; Neon does not create a second product source. Stock quantities are manually maintained and checked per enquiry; there is no inventory reservation or automatic stock decrement. A saved enquiry does not establish a sale or detect a WhatsApp message.

## Configuration and rollout

No new paid service or database was provisioned. Existing Vercel configuration contains Neon `DATABASE_URL`/`POSTGRES_URL` and Clerk keys for Production/Preview; database schema availability was not checked using production credentials. Existing Neon Auth variables are intentionally unused: Clerk remains the sole login system.

Server-only required values:

- `DATABASE_URL` (preferred) or `POSTGRES_URL` from the existing Neon connection.
- `CLERK_SECRET_KEY`, matching `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (only the latter is public).
- Existing `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `BLOB_READ_WRITE_TOKEN` remain unchanged.
- `VITE_PUBLIC_SITE_URL`: exact trusted HTTPS origin; both public canonicals and server authorization depend on it. Preview testing needs its exact origin configured in that environment; broad wildcard trust is intentionally absent.
- Optional existing analytics/newsletter values remain disabled unless real configuration exists. Never prefix a database URL or secret with `VITE_`.

After review, use a trusted terminal with server environment loaded securely (not committed):

```sh
npm ci
npm run db:migrate
npm run catalogue:upgrade              # dry run against existing Blob
npm run catalogue:upgrade -- --apply   # only after reviewing proposed legacy changes
npm run verify
```

The catalogue script only updates original records still at exactly ₹200 with no jar size. If the catalogue is uninitialized, new verified seed values already apply. If original records have deliberate owner changes, they are skipped: confirm/update them through the existing panel. Migration does not run at build/startup or from a public URL. `npm run dev` serves the frontend only; use `vercel dev` with securely loaded server environment for real local API testing. Run a single migration process per database; changed applied migrations are rejected. Review the target database/backup before applying any migration.

GitHub publishing/Vercel deployment were subsequently authorized and completed. In an authenticated owner session, verify real upload/save, business settings and a test enquiry. Configure verified Hyderabad areas, delivery rates/timing/free-delivery rules only when known. No default 1–2 day promise was added.

## Verification

- Baseline: 61 tests passed before changes.
- Production build and frontend/server TypeScript: passed.
- Final automated suite: **78 tests passed**. New database tests execute real PostgreSQL statements/functions in isolated PGlite through an adapter for the production Neon driver's parameterized HTTP query generation; this is **not a live Neon connection test**. Coverage includes idempotency, revision conflicts, address ownership/defaults/deletion, server prices, enquiry snapshots, business setting conflicts, manual order totals/history and rate limits.
- React integration tests cover readiness/first visit/active session/session expiry/guest preference, cart merging/saving, field validation, failed request retention/retry and honest saved-enquiry states. Existing product editor uses mocked transport for upload/save; this does not prove a real owner session works.
- Local Chromium: no horizontal document overflow at 320, 390, 768, 1024 and 1440 px. Verified two jars/subtotal ₹298 with delivery/total unconfirmed, review fields, API failure and direct draft, missing-auth guest fallback, product size and branded not-found view. No page JavaScript errors observed. Catalogue/settings were local fixture responses; the enquiry endpoint deliberately returned 503. No message sent.
- Reduced-motion, keyboard dialogs, existing video/Jar Lab/photo controls remain covered by existing tests; physical-phone hardware and final provider-backed modal still require deployment checks.
- Formatting, whitespace and production dependency audit: passed; audit reports zero known production vulnerabilities at execution time, not a penetration test.

## Launch blockers / honest readiness

**Deployed, with commercial/authentication configuration still outstanding.** Live public routes, login UI and settings/catalogue reads are verified. Preview build logs record the additive migration, and the live settings endpoint successfully queries its table. Real signed-in cross-device/owner flows remain unverified. The existing Clerk resource is a development instance; owned-domain production setup and Google OAuth must still be completed by the owner.

Owner must confirm legal seller identity/address, retention/backup process, ingredients/allergens, storage/shelf life, stock, service PINs, delivery timing/rates, tax/payment arrangements and cancellation/refund terms. Payment status in the panel is a manual business record, never a gateway verification. No payment was collected, no customer account created and no real enquiry was submitted during testing.

References used: official Clerk React `useAuth` documentation, Neon serverless driver documentation and Vercel request-header documentation. Existing service integrations were preserved.

## Sign-out follow-up

Sign-out now redirects to `/sign-in` from both the account button and Clerk provider defaults. Closing a signed-in account dialog no longer saves a guest dismissal. A verified signed-in → loading → signed-out state transition clears stale guest dismissal before offering login again; choosing guest afterward still works. Regression coverage uses simulated session states, not a completed live Clerk sign-out. Build, 78 tests and formatting passed. This follow-up is now published on GitHub main and the production site.
