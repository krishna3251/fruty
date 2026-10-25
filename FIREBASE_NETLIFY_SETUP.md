# Free Firebase + Netlify migration

25 October 2026. Prepared in the existing `krishna3251/fruty` codebase. **Not activated on the live shop.** The current Vercel/Clerk site remains intact while Firebase access and Netlify configuration are completed. Code is saved on `migration/firebase-netlify-free`; `main` stays on the existing live release. This is a provider migration, not a redesign or database replacement.

## Actual Firebase access blocker

The connected browser's Firebase Console shows **Enable multi-factor authentication (MFA)** and says Google two-step verification must be enabled to gain Firebase access. The account holder must complete Google 2SV themselves at https://myaccount.google.com/signinoptions/twosv, then reload https://console.firebase.google.com/. No password, OTP, recovery code or security change was used or performed by the agent. No paid domain or plan is needed to resolve this access gate.

## Implemented

- Firebase provider behind `VITE_AUTH_PROVIDER=firebase`; the existing deployment defaults to Clerk until an explicit cutover.
- Real Firebase SDK email/password signup and login, opt-in Google popup login, essential persisted authentication state, verification email/resend/check, profile-name updates, sign-out, password recovery using Firebase's hosted action page, and guarded account deletion. UI includes labels, password-manager attributes, show/hide, errors, loading, duplicate-request guards and guest access.
- Google appears only when `VITE_FIREBASE_GOOGLE_ENABLED=true`; enable it only after the actual provider/domain setup is complete.
- Server Firebase Admin token verification includes revocation/disabled-account checks and verified email. Protected owner operations require both the exact owner Firebase UID and verified owner email, plus the existing server-side salted panel-password check. Production refuses an auth emulator.
- Neon remains the customer/cart/address/enquiry/settings database. Firebase identities are namespaced by project + UID in the existing identity column; **email alone never links a new login to someone else's old store account**.
- `scripts/link-customer-identity.ts` provides an explicit single-account migration dry run. It verifies the selected identities with both providers and requires their matching verified email, an active Firebase account, an existing legacy store row, and no existing target store account. `--apply --confirm-backup-and-cutover` transfers the identity on the same customer UUID without copying passwords or rewriting linked addresses/carts/enquiries. It never runs in a build or public API.
- Netlify Functions adapter keeps existing `/api/*`, dynamic product metadata, sitemap, archived pages, methods, errors and HTTP statuses. Security headers also apply to function responses. Static Netlify headers are generated during the Netlify build.
- Netlify Blobs adapter replaces Vercel Blob on the new deployment: strongly consistent catalogue reads, ETag conditional writes, sanitized WebP uploads, immutable photo delivery. No images are moved into Neon.
- Existing design, original MP4, two products, prices/jar sizes, ₹150 standard delivery, WhatsApp review, guest cart, owner UI and archived fruit demo are preserved.
- Updated storage/privacy disclosures distinguish Firebase/Netlify from the retained Clerk/Vercel deployment.

## Owner setup after 2SV

1. Create/select a Firebase project on the **Spark** plan. Analytics and other services are not required. Do not enable paid services or attach billing for this Auth-only setup.
2. Register a Web app. Enable Authentication → Email/Password; configure a minimum password length of 8 or stronger. Enable Google if wanted and select the actual support email. Keep email-enumeration protection enabled.
3. Create/import the existing GitHub repository in Netlify on its Free plan. Select `migration/firebase-netlify-free` for the initial configured deployment, because `main` has not been switched. Use that branch's `netlify.toml`. A real assigned `*.netlify.app` address is enough; no custom domain is required. No Netlify connector was found in the available directory, so deployment needs a signed-in Netlify account/UI or securely configured CLI access.
4. In Firebase Authentication settings, add the **actual** Netlify site hostname to Authorized domains. Review Firebase's verification/password-reset email templates and test delivery. The hosted reset handler avoids needing a new custom action-page domain.
5. Configure the following values in Netlify. Never paste service-account credentials, passwords or tokens into chat, source files, screenshots or GitHub.

### Build-time public configuration

| Name                           | Value/source                                                             |
| ------------------------------ | ------------------------------------------------------------------------ |
| `VITE_AUTH_PROVIDER`           | `firebase` (also set by Netlify build config)                            |
| `VITE_FIREBASE_API_KEY`        | Firebase Web app public config                                           |
| `VITE_FIREBASE_AUTH_DOMAIN`    | Your project's assigned `PROJECT_ID.firebaseapp.com`                     |
| `VITE_FIREBASE_PROJECT_ID`     | Your actual Firebase project ID                                          |
| `VITE_FIREBASE_APP_ID`         | Firebase Web app App ID                                                  |
| `VITE_FIREBASE_GOOGLE_ENABLED` | `true` only after Google is enabled and tested                           |
| `VITE_PUBLIC_SITE_URL`         | Actual HTTPS Netlify site origin; build can use Netlify's assigned `URL` |

### Functions runtime configuration

| Name                            | Value/source                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `AUTH_PROVIDER`                 | `firebase`                                                                                                     |
| `HOST_PLATFORM`                 | `netlify`                                                                                                      |
| `CATALOGUE_STORAGE`             | `netlify`                                                                                                      |
| `VITE_PUBLIC_SITE_URL`          | Same exact Netlify origin, used for trusted-origin checks and live metadata                                    |
| `FIREBASE_PROJECT_ID`           | Same Firebase project as frontend                                                                              |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-only service account JSON for verifying tokens and reading user status; grant only required permissions |
| `FIREBASE_ADMIN_UID`            | UID of the verified store-owner Firebase login                                                                 |
| `ADMIN_EMAIL`                   | Verified store-owner login email; not automatically the public support mailbox                                 |
| `ADMIN_PASSWORD_HASH`           | A newly rotated salted scrypt hash; never a plaintext password                                                 |
| `DATABASE_URL`                  | Existing Neon connection, supplied securely; no replacement database                                           |
| `NETLIFY_BLOB_STORE`            | Explicit production store name, e.g. `tropical-feast-catalogue-prod`                                           |

Keep production database/credentials/store separate from deploy previews. Do not expose production Neon writes or the production Blobs store to untrusted preview builds. Runtime secrets belong in Netlify Functions scope, not public `VITE_` variables. Do not set `FIREBASE_AUTH_EMULATOR_HOST` in production. The live Clerk secret/Blob connection remain on the old host until cutover is verified.

## Catalogue and account cutover

- Pause owner edits during transfer and take a verified database backup/export first.
- Read the actual Vercel catalogue before switching. If it still uses the original local owner images and unchanged initial records, the new Netlify store starts from those same confirmed seeds. If any products, edits or uploaded images exist, explicitly copy the real catalogue and uploaded bytes into Netlify Blobs first; preserve IDs, image paths, prices and content. **No automatic import or source deletion has been run.**
- Keep old Clerk records intact. Use the explicit identity-transfer dry run for each approved account; no bulk email-based migration. If the new Firebase login already created store records, stop and review both accounts rather than overwriting either.
- Example dry run (IDs are placeholders, not credentials): `node --import tsx scripts/link-customer-identity.ts --clerk=user_ID --firebase=UID`. Supply both providers' server credentials through a secure environment, not command-line values. No production transfer was executed.
- Guest carts are browser/origin-specific: an old Vercel guest cart does not automatically move to a different Netlify origin. Do not claim cross-domain localStorage transfer.
- Do not remove Clerk, old hosting, Blob records or historical database rows until the owner verifies real account recovery, data continuity, owner access and orders on the new host.

## Verification actually executed

- Production TypeScript/Vite build and formatting passed. A Netlify build with explicitly synthetic public configuration generated all 11 page heads and static security headers for a test-only `.example.test` origin; the normal build was then restored. TOML parsed successfully. The Netlify function entry bundled with esbuild, and its bundled handler returned the expected 404/security headers locally with installed dependencies. This is not an actual Netlify deployment.
- **91 automated tests passed**: retained 84 tests plus Firebase UI recovery/signup errors and duplicate requests, server identity/disabled/unverified checks, missing-auth fail-closed paths, production emulator refusal, Netlify routing/security/status/HEAD/archive handling and catalogue CAS conflicts.
- Netlify storage tests use a local fake Store; existing database tests use isolated PostgreSQL. They are not actual Netlify/Firebase deployment or email-delivery tests.
- Firebase Console browser inspection verified the MFA gate, not a working Firebase project. No account signup, password reset, Google OAuth, verification email, account deletion or new cloud project was performed.
- No database migration, live identity update, product/image import or production host switch was run.
- Dependencies added: modular `firebase`, server-only `firebase-admin`, and `@netlify/blobs`. A patched `@grpc/grpc-js` override avoids the vulnerable transitive Firestore copy; the app does not use Firestore. Existing Clerk/Vercel packages are retained only for the working deployment/transition.

## Ready status

**Code prepared for configured testing; migration is not live.** Blocked by Google 2SV/Firebase project access and a configured Netlify deployment. After those are ready, verify real signup, email verification, Google popup, recovery link, session restore/logout, saved carts/addresses, owner image uploads/edits, catalogue transfer, an explicitly approved test enquiry, actual HTTP routes/CSP and physical phone behavior. No paid service is required by this implementation, but free tiers have quotas and do not provide unlimited traffic or an SLA.

Business launch still needs confirmed legal seller/address, ingredients/allergens, storage/shelf life, service areas/timing, cancellation/refund/payment terms, retention/backups and rotation of shared credentials. No online payment gateway was added.

References: Firebase Web Auth, Admin token verification, Google MFA requirements, Netlify Functions/Blobs documentation. Current production stays at https://fruty-fawn.vercel.app until an explicit verified cutover.
