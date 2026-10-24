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
3. Complete Clerk production-domain setup before a commercial launch. If your production Frontend API uses a custom hostname, add that exact HTTPS origin to CSP `script-src` and `connect-src` in `vercel.json` before switching the key. Never put a secret key in a `VITE_` variable or commit credentials.
4. Confirm business privacy information, account retention and deletion processes with the actual provider configuration.
5. Sign up using your own email and verify it, test sign-out/re-login, and test Google sign-in once configured. We do not send verification emails or create users on the owner’s behalf during automated checks.

## Verification

Local and live verification results will be recorded after publication.

References:

- https://clerk.com/docs/react/getting-started/quickstart
- https://clerk.com/docs/guides/secure/best-practices/csp-headers
- https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google
- https://clerk.com/docs/guides/how-clerk-works/cookies
