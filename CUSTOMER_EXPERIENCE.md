# Customer review and playful pantry upgrade

## Review from an Indian customer's point of view

What already works: real owner-supplied photos, ₹ pricing, the two confirmed flavours, a persistent illustrated guest cart, WhatsApp/Gmail enquiry links, clear quantity controls, account entry, privacy controls and a separately protected owner catalogue panel.

Problems addressed:

- ₹150 delivery was clearest only after opening the cart. It now appears in the hero, a shopping information strip, cards and detail totals. A ₹200 jar is shown as ₹350 with delivery. The original two-jar pair is ₹550 with one delivery charge, using current catalogue prices rather than hardcoded promotional prices.
- The homepage took a long path through product storytelling before displaying shopping cards. Product choices now follow the hero and shopping information; the original flavour scenes remain below the interactive experience.
- Static product imagery offered little exploration. Cards now have a subtle mouse tilt, a real-photo quick look and a keyboard-accessible zoom dialog. No fake alternate product views were created.
- The unconnected newsletter was a dead end. Its component remains available but the homepage shows it only when its endpoint is configured.
- Jar size, stock and ingredients are still not verified. The interface keeps these gaps visible, without filling them with invented claims, reviews, stock, certifications, delivery dates or payment promises.
- Re-running metadata generation could preserve previously generated tags in the template. It now strips prior canonical/social/structured metadata and noscript content before generating page-specific output; tests check a single canonical and JSON-LD block.

## Visual direction and inspiration

Warm cream, muted sage, pineapple gold and deep olive. Larger serif product names, restrained borders, photo-led cards, readable delivered totals, tactile controls and more conversational copy. Original brand, photography, hero film, cart, auth, owner APIs and archived fruit routes remain.

21st.dev research: [Product Image Card](https://21st.dev/@ruixen.ui/components/product-image-card), [Presence Card](https://21st.dev/@ravikatiyar162/components/presence-card), and range-slider patterns. These informed the image viewer, light pointer tilt and explicit slider controls. The components were written for the existing project; no registry source or unnecessary UI library was installed.

## Jar Lab

The original 1280 × 720, 24 fps local film was inspected again. The lid is raised at 6.5 seconds and seated at 7.5 seconds. Openness from 0–100 maps continuously to video time 7.5–6.5 seconds. Dragging up lifts the lid; down closes it. Pointer capture, cancellation, a labelled native range slider, explicit open/close and reset buttons provide complementary controls.

The second video element is created only after an intentional interaction, uses the same cached local MP4, never autoplays, and reuses the existing seek-coalescing controller. The hero remains inline autoplay with pause and offscreen behavior. No scroll pinning or hijacking was added. Reduced motion and the site pause control use original still frames instead; loading/error states preserve a matching poster and a usable still-frame fallback. Both new WebP posters are direct extractions of the supplied footage, not generated product images. The recording's camera movement and source framing remain; this is a reversible video interaction, not a fabricated 360-degree product model.

## Files

- `src/components/JarLab.tsx`, `src/lib/jarInteraction.ts`: lid interaction, keyboard/touch controls and fallback.
- `public/videos/jar-sealed.webp`, `jar-lifted.webp`: original footage stills.
- `src/components/ProductGallery.tsx`: photo inspection and zoom dialog.
- `src/components/ShoppingConfidence.tsx`: service area, delivery and guest ordering information.
- Existing `Pickles.tsx`, `CinematicHero.tsx`, `App.tsx`: cards, delivered totals, pair cart action, shopping order, navigation and configured newsletter rendering.
- `src/experience.css`, `src/main.tsx`: scoped visual layer and responsive styling.
- `scripts/build-pages.ts`, relevant tests: idempotent metadata generation and regression coverage.

No dependency, authentication-permission, payment, product-data or secret changes were needed.

## Verification and limitations

61 automated tests pass, including continuous/reversible drag mapping, pointer/range controls in reduced motion, photo zoom/focus restoration and the pair cart action. Frontend/server TypeScript, build and format checks are included in `npm run verify`. Live browser checks and screenshots are recorded after deployment. Phone CSS uses a single-column product grid, a stacked Jar Lab, large native/touch controls and no hover dependency; an actual phone viewport is not available in this browser environment.

## Owner information still needed

The next trust improvements need real business information, not decorative widgets: exact net jar sizes, ingredients and allergens, shelf-life/storage directions, seller/legal identity and address, delivery coverage and usual lead time, accepted payment methods, tax treatment and clear cancellation/refund/support terms. Add only verified reviews, with permission, once they exist. Clerk production setup and a real owner-session upload/save test remain pending from the previous update. No COD, UPI checkout, payment success, pincode delivery guarantee or order tracking is claimed by this enquiry-based store.
