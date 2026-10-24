# Owner product panel and customer cart

## Owner access

Open `/admin` or **Owner panel** in the footer. Sign in with the verified Clerk account belonging to the configured owner email, then enter the panel password supplied by the owner. It is a separate gate from the customer's Clerk password. No customer can become an administrator by signing up or changing browser storage.

Production configuration is set in Vercel: `ADMIN_EMAIL` and a randomly salted scrypt `ADMIN_PASSWORD_HASH` (64 bytes). The original password is not in the source, bundles, documentation, local storage or GitHub. The panel keeps the entered password in memory only until it is locked or reloaded. Each mutation verifies the Clerk session, the trusted origin, verified owner email and panel password on the server. Owner access is enabled only in Production, not Preview.

Clerk remains connected to its development instance. The owner still needs an owned domain and Clerk production setup, including production Google OAuth configuration, before authentication is production-ready. No owner account was created, verification email sent, or password for the Clerk account set by this change.

## Product editing

The panel supports adding and editing products, prices in INR, product photos, descriptions, photo alt text, availability, and optional verified jar sizes and ingredients. Existing product slugs stay stable; newly created slugs must be unique. An unavailable product remains discoverable but cannot be added or submitted in an enquiry.

Products are stored in a connected private Vercel Blob store, `fruty-products`, in `bom1`. The server publishes only catalogue data and product images through same-origin endpoints. Photos must be JPEG, PNG or WebP, under 2 MB and 24 megapixels; they are decoded, metadata stripped, resized to at most 1600 × 1600 and converted to WebP. No external image URL, SVG or executable upload is accepted. Stored photos are immutable. Replaced or abandoned uploads are retained; bulk media deletion is intentionally not offered.

Catalogue writes use ETags to reject conflicting edits, including a race during initial creation. Reload latest catalogue after a conflict. Saving confirms only a successful server response. Errors retain the draft. Price changes flow into the catalogue, product details, saved carts, enquiry drafts, server-rendered product metadata and the live sitemap. No payment, inventory reservation or order processing was added.

The public shop refreshes catalogue data on load; an existing open customer tab needs refresh after an owner edit. If live reads fail, the original two-product catalogue remains available with a warning. Confirm prices and stock through the enquiry channel in that case.

## Customer changes

- The header opens a login dialog on demand, with registration and a guest exit. It does not force an unsolicited popup.
- Product cards and details have clear **Add to cart** buttons; an added product offers **View cart**.
- Cart contents persist on the device, including newly added catalogue products, with quantity controls and photos.
- Delivery is ₹150 once per nonempty enquiry, independent of quantity. Empty carts have no delivery charge. Product subtotal, delivery and total appear in the cart and in WhatsApp/Gmail drafts.
- A 2-jar cart at ₹200 each totals ₹550. It prepares an enquiry; it does not confirm an order or collect money.
- Mobile login has an explicit caption, larger shopping targets, stacked owner forms and bounded dialogs. Essential authentication cookies remain independent from optional analytics consent.

## Files and endpoints

- `src/components/AdminPanel.tsx`: owner interface, unlock, upload/save/error states.
- `server/admin.ts`: server authentication, verified-email check, password-hash verification.
- `server/catalogue.ts`: persistent catalogue reads and conditional writes.
- `api/catalogue.ts`: public reads, protected add/edit/unlock.
- `api/product-image.ts`: protected image processing/upload and public image delivery.
- `api/product-page.ts`, `server/productPage.ts`: current product HTML and genuine 404s.
- `api/sitemap.ts`: live sitemap including new products.
- `src/context/Catalogue.tsx`: shared live catalogue and read-failure fallback.
- `src/lib/catalogue.ts`: input validation and totals.
- Existing App, account, product, selection, cart, metadata, privacy/terms and CSS were extended.
- `tsconfig.server.json`: server type checking included in the build.

## Verification

`npm run verify`: production build, frontend and server TypeScript, 57 automated tests and Prettier passed. Tests cover owner-identity matching, salted-password verification, forbidden origins, input/file rejection, delivery totals, dynamic product/carts, login-dialog operation, and editor error/success flows using mocked transport. The authenticated add/upload/save flow has not yet been exercised with a real owner session. Production dependency audit and live deployment checks are recorded after deployment verification. A fresh actual phone viewport was not available in the cloud browser; responsive styles were inspected and mobile-specific behavior tested where possible.
