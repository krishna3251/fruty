# Fruity — pickle-first reconstruction

## Why the site needed reconstruction

The live homepage had two storefronts stacked together: pickle content followed by a complete fruit hero, four fruit chapters, sample fruit prices, bestsellers, fruit reviews, an account demo and fruit cart. `/shop` still meant fruit. Navigation, footer, policies and SEO therefore disagreed with the intended pickle business.

## Result

The primary website now presents only pickles: Fruity / The Pickle Edit. Home, `/shop`, `/pickles`, two collection pages, four pickle product pages, `/ordering`, contact, policies and 404 use the same forest-green, ivory, sage and editorial-serif visual direction. Navigation, FAQ, newsletter, social metadata and the sitemap now follow that purpose. The four product records remain unchanged: no price, size, ingredient, stock or contact has been invented. The pale vegetable remains unconfirmed; Hyderabad-only is scoped to Tropical Feast.

A device-local enquiry list replaces the fruit account/cart controls in the primary UI. Visitors can save/remove known pickle IDs, see collection-separated enquiry information, and copy an editable-by-selection enquiry draft. Failed clipboard access shows a manual-copy recovery; copying never sends a message. The existing verified-HTTPS-only Tropical Feast DM setting remains optional. Missing supplier contacts stay visibly unavailable. Online payment and order confirmation are not simulated.

## Preserved functionality

The fruit store and checkout code are retained in `src/LegacyFruitStore.tsx`, lazy-loaded on `/fruit-demo`, `/fruit-story` and the original six fruit product routes. Those archived pages receive noindex metadata and stay outside the primary sitemap. `/shop` intentionally changes meaning to the pickle catalogue. Existing fruit cart, wishlist, receipts, product data and checkout utilities retain their original storage keys and behavior. Old fruit commerce tests now explicitly exercise the archived module, alongside new tests for the primary application.

## Main implementation files

- `src/App.tsx`: primary pickle shell, navigation, footer, ordering, FAQ and missing-page flow.
- `src/components/Pickles.tsx`: shared collection, card and detail UI, with enquiry-save controls.
- `src/context/PickleSelection.tsx`: validated, unique device-local pickle selection and cross-tab updates.
- `src/components/EnquiryList.tsx`: supplier-separated shortlist, copy draft, empty/error states.
- `src/hooks/usePantryMotion.ts`: optional desktop scroll-linked jar/heading movement; dynamic GSAP loading, cleanup, reduced-motion and pause support; no scroll hijacking.
- `src/pantry.css`: scoped primary design and phone/tablet breakpoints, preserving archived CSS.
- `src/lib/seo.ts`, `scripts/build-pages.ts`, `vercel.json`: 13 public indexable page heads, eight noindex archive heads, confirmation metadata, sitemap and direct-route behavior.
- `src/components/InformationPage.tsx`, `PrivacyControls.tsx`: truthful enquiry storage, clipboard, provider and archived-checkout disclosures.
- `public/404.html`, `public/social-card.png`, `public/site.webmanifest`: pickle-focused identity and recovery.

## Imagery

`public/images/pickles/pantry-editorial-concept.webp` is a new AI-created editorial packaging concept, not an actual product photograph. Its visible caption and alt text say so. The existing product SVG illustrations remain explicitly labelled. Actual supplier photos/ingredients/packaging are still required.

The built-in image-generation tool created the hero. Prompt: premium natural editorial product-mockup, two golden-lidded glass jars with cucumber slices and pale unspecified vegetable pieces, ivory limestone tabletop and sage plaster background, warm window light, blank cream labels, no lettering or claims, full jars within frame, restrained botanical sprig and linen. The output was inspected and optimized to WebP (max 1400×1120); no generated label text is used as product information.

## Validation and limits

Baseline before reconstruction: build, formatting, 24 tests passed. After implementation: build passes and 29 Node/jsdom tests pass, including the original commerce tests, the primary pickle-only homepage/shop, enquiry persistence/grouping/copy failure and success, unknown-route recovery, unpriced product saving, legacy lazy-route preservation, and noindex archive/sitemap checks. Formatting and whitespace checks pass. No dependencies were added and no lint command exists.

A cloud browser can access the public deployment for desktop QA. The browser currently advertises no viewport-resizing capability, so this reconstruction's small-device breakpoints are checked in code; earlier screenshot/device results describe the prior version and are not proof of this new shell. Do not claim current mobile visual QA or frame-rate/screen-reader benchmarks without executing them. Live desktop/HTTP observations will be reported separately after deployment.

## Owner configuration still needed

Actual product photographs; pale-vegetable identity; INR prices, jar sizes, ingredients/allergens, stock, supplier identity and commercial terms; real website business/support details; Tropical Feast's verified `VITE_TROPICAL_FEAST_DM_URL`; independently verified Fermented Pickles ordering details. Analytics and newsletter integrations stay off until configured and validated. See `PRODUCTION_SETUP.md` for existing environment contracts. This is a deployable pickle enquiry catalogue, not a connected payment/fulfilment system.

## Live desktop observations

The production homepage and `/shop` were inspected in the cloud browser at its default 1363px viewport. Home had four pickle cards, zero fruit product cards, no completed-image failures and no horizontal document overflow (scroll width 1348px). Shop navigation correctly opened “The pickle pantry.” Saved Fermented Pickles cucumber and Tropical Feast pineapple entries appeared in separate enquiry groups; the copied-draft confirmation explicitly stated that nothing had been sent. Existing product selections remain device-local. Application-origin console errors were not observed during the check; the browser’s own extension emitted unrelated metadata errors. The hero's second jar was partly cropped on the first screenshot; image positioning was corrected to keep the jars in frame. No mobile viewport capability is available in this browser, so current phone/tablet layout remains code-inspected rather than visually verified.

Live URL verification also passed for 20 paths: public pages, the concept WebP, the 13-entry sitemap, noindex archive examples and unknown URLs with HTTP 404. Scrolling changed collection jar transforms from the initial position to the scrubbed endpoint; pausing reverted them to `none`, and resume restored motion. Copying the enquiry draft showed the genuine clipboard success state. No supplier message or transaction was submitted.
