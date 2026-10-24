# Review fixes — 24 October 2026

- Replaced the desktop pinned, scroll-controlled hero with the same muted inline product-film playback used on phones. No hero pin spacer or scroll seeking remains. The original MP4 and full-frame composition are preserved. Pause/Play, final-frame hold, offscreen/tab visibility pause, slow-loading poster, retry and reduced-motion manual controls remain.
- Redesigned the enquiry cart with product photographs, readable per-jar prices, touch-friendly quantity controls and subtotal. WhatsApp and Email are prominent filled/outlined buttons; native email fallback and draft copying are available inside a secondary disclosure. Destinations remain behind links.
- Replaced the tall empty drawer with a content-sized panel and two photo-based quick-add choices. Internal browse links dismiss the drawer even on the current route.
- Addressed the review screenshot’s heading focus rectangle without removing keyboard focus indicators from interactive controls. Added breadcrumbs, compact spacing, visual ordering steps and both pictured flavours to the ordering page.
- Updated homepage metadata to describe film playback rather than scroll control. Two flavours, ₹200 prices, actual enquiry redirects, existing product routes, privacy/consent behavior and archived fruit features are preserved.

## Reference

Cart refinement follows Baymard’s recommendations for clear product review and immediately updating quantity buttons, adapted to this enquiry-only shop:

- https://baymard.com/blog/ecommerce-ux-audit
- https://baymard.com/research-articles/auto-update-users-quantity-changes

No images or layouts were copied from other stores. Product photography remains the owner’s supplied assets.

## Verification

- `npm run verify`: TypeScript/Vite production build passed, all 43 tests passed, formatting passed. `git diff --check` passed.
- Source deployment `be930c1` reached Vercel READY and the public alias serves the update.
- Actual browser at 1363 × 936: hero video was muted, playing, readyState 4, without native controls. Hero mode is autoplay; zero pin spacers; no horizontal overflow.
- Empty cart displays both supplied product photos and working quick-add buttons, within a compact content-sized drawer.
- Quantity changes produce the correct subtotal and Gmail draft (two pineapple + one cucumber = ₹600). Both external actions have the encoded draft; no message was sent during testing.
- Collapsed draft remains outside the accessibility tree. Tabbing from its disclosure summary wraps to the close button instead of entering hidden controls.
- Ordering route retains the header, has no horizontal overflow, and the programmatically focused heading has no outline box.
- Mobile layouts and safe-area rules were reviewed in code. A fresh mobile viewport screenshot was not possible because the available browser has no viewport-emulation capability; this is not claimed as a live mobile visual pass.
- [Live desktop photo-cart screenshot](docs/photo-cart.jpg).

Email/WhatsApp links prepare drafts; no message is sent automatically. Payment/inventory services and unknown commercial details were not fabricated.
