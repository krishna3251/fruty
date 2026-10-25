> **Latest V4 update (25 October 2026):** See [V4_IMPLEMENTATION.md](V4_IMPLEMENTATION.md) for the current audit, recovery/cart/mobile improvements and owner-confirmed ₹150 standard delivery. Historical release notes below describe earlier versions.

> **25 October update:** See [UPGRADE_REPORT.md](UPGRADE_REPORT.md) for the prepared Tropical Feast account/Neon/WhatsApp upgrade, verified ₹149 / 200 g defaults, location-based delivery, migration instructions and actual test limits. Older entries below describe earlier deployments. The upgrade and login recovery fix are published; see [LIVE_RELEASE.md](LIVE_RELEASE.md) for deployment checks and remaining limits.

# Customer accounts — Clerk / React + Vite

The existing Clerk Marketplace resource connected to Vercel project `fruty` is used. No replacement application or user database was created.

## Implementation

- Header Account link; `/account`, `/sign-in`, `/sign-up` routes.
- Actual Clerk prebuilt sign-in, registration, verification/recovery flows and authenticated profile/security management. Available methods are controlled by the connected Clerk dashboard; the site does not fabricate Google availability or registration success.
- Explicit sign-out with loading/error feedback. No browser-only login flag, hand-rolled password storage or fake account records.
- Clerk SDK loads only on account routes. Essential session cookies are disclosed separately from optional analytics; SDK telemetry is disabled.
- Guest enquiries and the existing device-local basket remain available. Login does not sync baskets, create orders, store delivery addresses or add payment/history features.
- Account routes are noindex, excluded from the sitemap and served with no-store headers. Sign-in and sign-up completion redirect to `/account`; Clerk handles the authentication lifecycle.
- The public frontend key uses `VITE_CLERK_PUBLISHABLE_KEY`, or the Vercel integration’s `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` through an explicit Vite build alias. `CLERK_SECRET_KEY` is never exposed or used by the frontend.
- Missing/invalid configuration and slow/unavailable provider connections show honest recovery states. Existing CSP restrictions are retained with the Clerk/Cloudflare domains required for auth added; no unsafe-eval or inline-script permission was introduced.

## Owner configuration

1. Open the existing resource in Clerk. Enable desired email registration, verification and recovery methods. Enable Google for sign-up/sign-in if desired.
2. Production Google login needs your Google OAuth client configured in Clerk. Development credentials are for development only.
3. Complete Clerk production-domain setup before a commercial launch. Clerk requires a domain you own; the shared `fruty-fawn.vercel.app` address cannot be used for a Clerk production instance. If your production Frontend API uses a custom hostname, add that exact HTTPS origin to CSP `script-src` and `connect-src` in `vercel.json` before switching the key. Never put a secret key in a `VITE_` variable or commit credentials.
4. Confirm business privacy information, account retention and deletion processes with the actual provider configuration.
5. Sign up using your own email and verify it, test sign-out/re-login, and test Google sign-in once configured. We do not send verification emails or create users on the owner’s behalf during automated checks.

## Verification

- `npm run verify`: production TypeScript/Vite build, all 46 tests and formatting passed. Public-key validation, non-indexable account pages, no-store routing and missing-provider/guest navigation are covered.
- A separate Vite build with a synthetic public-key fixture verified the Vercel `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` alias. No actual secret was read or included.
- Production dependency audit reported zero known vulnerabilities at execution time; not a penetration test.
- Actual live browser: Clerk sign-in loads on `/account` with Google and email options. The Sign up link opens `/sign-up`, rendering the real email/password registration form and Google option. No horizontal overflow at 1363px.
- The connected resource is a DEVELOPMENT instance (`unique-flamingo-6954.clerk.accounts.dev`), confirmed by Clerk’s visible Development mode indicator. This is suitable for testing; production authentication is NOT ready until the owner completes production domain and Google OAuth setup. No completed account creation, email delivery, authenticated profile, logout or Google OAuth round trip is claimed as tested.
- Clerk remains authoritative for accounts. We did not enter credentials, send verification emails or create test users.
- Final branded deployment `54767d8` reached READY. The live registration page shows “Create your pantry account”, Google, email/password and the testing notice. No site console errors were observed in that final check.
- HTTP `/account`, `/sign-in`, `/sign-up`: 200, `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, and noindex metadata verified.
- Mobile CSS was reviewed for the extra header account control and stacked account layout. A new live mobile viewport check was not available in this browser.
- [Verified sign-up screenshot](docs/account-signup.jpg).

References:

- https://clerk.com/docs/react/getting-started/quickstart
- https://clerk.com/docs/guides/secure/best-practices/csp-headers
- https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google
- https://clerk.com/docs/guides/how-clerk-works/cookies

Production-domain requirement: https://clerk.com/docs/guides/development/deployment/vercel
