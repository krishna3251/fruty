# Validation

Checked in the task environment on 21 October 2026, using Node.js 24.

## Passed

- `npm run build`: strict TypeScript compilation and Vite production bundle.
- `npm test`: six tests, including cart restoration validation, immutable quantity updates, quantity limits, accurate catalogue totals, unique products, local image existence, and two React/jsdom integration tests.
- Integration coverage: category filtering, search with no results, reset filters, adding items, increasing quantity, subtotal review, demo checkout completion, localStorage restoration, item removal, empty cart, unavailable product controls, demo newsletter confirmation, dialog Tab trap, Escape dismissal, and focus restoration.
- Fruit cutouts visually inspected as a contact sheet; all six photographic WebP assets are present locally with transparent backgrounds.
- Source formatting checked with Prettier.

## Run attempted, visual verification blocked

`sites-preview start` successfully reported a running supervised Vite preview. The browser could not open the preview and subsequently rejected access under the environment's browser security policy. Loopback HTTP probing from the command sandbox also could not reach the isolated preview service.

**No desktop/mobile screenshots or end-to-end real-browser results are claimed.** The jsdom component tests exercise real React controls but do not simulate browser layout, ScrollTrigger geometry, touch input, or frame rate.

Before production release, open `npm run dev` locally and check:

- 1440px, 1024px, 768px, 390px, and 360px layouts; no horizontal page overflow.
- Scroll down and back up through the pinned showcase, then skip directly to the shop.
- Touch scrolling, reduced motion, keyboard-only navigation, focus visibility, and dialog overflow.
- Mobile performance, slow asset loading, and real browser storage restrictions.
- Replace or license demo photography for commercial use, and connect validated backend inventory, delivery, payment, account, and newsletter services when ready.
