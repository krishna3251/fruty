# Phone and cookie improvements — 24 October 2026

## Changes

- Compact mobile account introduction, earlier access to sign-in/sign-up forms, responsive Clerk card sizing and shorter account heading.
- Header spacing and tap targets refined for 320–767px layouts. Cart removal and contact actions have larger hit areas; narrow product rows preserve quantity controls.
- First-visit cookie/storage notice: an acknowledgement when only essential functionality is configured; explicit reject, preferences and accept controls only when optional analytics is actually configured.
- Banner stays clear of account forms, active form editing, cart drawers, mobile navigation and policy pages. Mobile notice/dialog use bounded dynamic-viewport heights, scrolling and safe-area spacing.
- Preferences clearly separate essential shopping/session storage from optional analytics. Rejecting analytics does not disable Clerk login or remove its cookies.
- Closing/reopening preferences and changing the analytics checkbox preserve keyboard focus. Cross-tab storage clearing now refreshes consent state.
- Choice acknowledgement uses the existing 180-day consent storage key; blocked browser storage falls back to visit-only state. No new tracking provider was added.

## Verification

Local: production build, 48 tests and formatting passed; `git diff --check` passed. Added tests for acknowledgement persistence, banner suppression around forms/drawers, unconfigured analytics, keyboard focus and preserving synthetic login cookies while removing analytics cookies.

Live browser observations will be recorded after deployment. Fresh mobile viewport emulation is unavailable in the current browser; small-screen rules were reviewed in code, not claimed as a device/browser pass.

Clerk remains in development mode. Its production-domain and Google OAuth configuration requirements are unchanged. No account creation or authenticated session round trip was performed.
