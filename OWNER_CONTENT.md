# Tropical Feast: owner-confirmed content

The latest owner clarification supersedes the earlier four-product brief. The active catalogue contains exactly two flavours, both branded Tropical Feast: Pineapple Pickle and Cucumber Pickle. Fermented Pickles and the unconfirmed pale vegetable are no longer active collections/products.

## Supplied imagery

- `public/images/pickles/owner-hero.webp`: supplied first image, two jars, homepage.
- `public/images/pickles/owner-logo.webp`: supplied second image, brand logo in header/footer.
- `public/images/pickles/pineapple-pickle.webp`: supplied third image, pineapple product.
- `public/images/pickles/cucumber-pickle.webp`: supplied fourth image, cucumber product.

Images were resized and compressed to WebP without altering their pictured labels or contents. Original uploads were not modified. Favicons use the supplied logo; the social preview combines the supplied logo and hero. Captions identify owner-supplied imagery. Image contents do not establish ingredients or other commercial details.

## Implementation

`src/data/pickles.ts` is the source of truth for the two products, one collection and brand assets. Homepage, shop, product pages, search, flavour filters, saved enquiry drawer and metadata consume those records. Both products use the owner-confirmed price of ₹200 each. Sizes and ingredients remain null; stock is unconfirmed. Both flavours retain the supplied Hyderabad-only/direct-message information. No payment or order confirmation is simulated.

Old fermented cucumber saved selections migrate to the sole cucumber product and are deduplicated. Removed pale vegetable selections are dropped. Vercel redirects the former fermented collection to the shop and former duplicate cucumber to the current cucumber product; the removed pale vegetable URL returns 410 with recovery links. The fruit demonstration remains archived separately and excluded from search indexing.

## Verification for this update

Executed `npm run verify`: TypeScript/Vite production build, all 29 automated tests and Prettier checks passed. Build generates unique metadata for 10 indexable pages. Tests cover two confirmed records and real local image assets, missing commercial fields, persisted selection migration, search/filter/detail navigation, safe enquiry configuration, privacy/consent/error handling and retained fruit demo checkout.

Live browser and HTTP checks are reported separately after deployment; automated DOM tests do not establish visual layout or real fulfilment.

## Owner configuration still required

- WhatsApp and email enquiry destinations are now supplied by the owner and active. `VITE_TROPICAL_FEAST_DM_URL` and `VITE_CONTACT_EMAIL` can override the configured defaults. UI labels do not expose raw contact strings; destinations necessarily appear in link URLs.
- Jar sizes, full ingredients/allergens, current availability, delivery charges/times, handling/storage and commercial terms.
- Legal business identity, support hours and physical address. Product brand imagery is not a verified legal identity.
- Optional newsletter endpoint and analytics ID only if wanted; both remain disabled without configuration.
- Rights to supplied imagery and final legal review before live commercial sales.

The site can serve as a product/enquiry catalogue; commercial checkout remains unconnected.

## Live verification

Production deployment `2267e72` reached READY on `https://fruty-fawn.vercel.app`. Live HTTP checks returned 200 for all 10 indexable pages, four supplied image assets, robots and sitemap. Unknown URLs returned 404; removed pale vegetable URL returned 410; retired collection/duplicate cucumber URLs returned 301 to the shop/current cucumber. Sitemap contains 10 URLs and no retired fermented entries.

Chrome visual checks: homepage at 390 and 1680 pixels, product details at 320 and 768 pixels, and scroll sections at 1280 pixels. Document scroll width did not exceed viewport client width at 320, 390, 768, 1280 or 1680. The mobile menu opened and navigated; the cucumber filter, save action, enquiry drawer and product detail link worked at 320 pixels. Drawer settled inside the viewport. No loaded image failures or console errors were observed in this browser session. Desktop product transforms changed with scrolling; mobile motion remains simplified. Default browser viewport was restored. These were browser viewport checks, not tests on physical devices or a network/performance benchmark.

Screenshot: [Desktop homepage](docs/tropical-feast-home.jpg). A final copy-only polish followed these visual checks; `npm run verify` passed again (29 tests, production build and formatting).

## Mobile playback, prices and contacts — 24 October 2026

Owner confirmed ₹200 for each of the two pickles and supplied a WhatsApp destination and email. `src/lib/config.ts` stores these public enquiry destinations, with environment overrides; `src/lib/contact.ts` validates and encodes links and optional draft messages. Public pages show button labels only, including contact/privacy pages and footer. Opening a link does not automatically send a message. Product details and saved lists include the selected products and prices in the enquiry draft. Newsletter remains disconnected, and no checkout/payment was added.

Normal phone layouts now autoplay the same muted inline film without browser chrome or the desktop chapter rail. A custom accessible play/pause button remains available; playback pauses when out of view or when the tab is hidden, and the final product frame is held. Browsers that block autoplay show a Play button. Reduced-motion, explicit manual mode and paused motion retain manual controls. Desktop scroll seeking is preserved. The redundant loading-poster element in the rail was removed.

Executed `npm run verify`: production build, all 36 tests and formatting passed. Added checks cover autoplay/pause/cleanup, owner prices, encoded contact links and absence of raw contact details in rendered page text. Browser validation follows deployment.
