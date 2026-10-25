import { authProvider } from "../lib/firebaseConfig";
import { useState } from "react";
import { siteConfig } from "../lib/config";
import { useBusiness } from "../context/Business";
import { enquiryWhatsApp, enquiryGmail } from "../lib/contact";
export default function InformationPage({ path }: { path: string }) {
  const business = useBusiness();
  const [error, setError] = useState("");
  const email = enquiryGmail(undefined, business.email);
  const whatsapp = enquiryWhatsApp(
    undefined,
    `https://wa.me/${business.whatsapp}`,
  );
  if (path === "/thank-you") {
    let confirmed = false;
    try {
      const t = Number(sessionStorage.getItem("furity-newsletter-confirmed"));
      confirmed = t > 0 && Date.now() - t < 1800000;
    } catch {}
    return (
      <section className="information-page section-pad">
        <h1>
          {confirmed ? "Thanks for subscribing." : "No signup to confirm."}
        </h1>
        <p>
          {confirmed
            ? "The configured newsletter service confirmed your signup. Check your inbox for any follow-up."
            : "No genuine newsletter submission was verified in this session."}
        </p>
        <a className="button primary" href="/">
          Back to the pantry ↗
        </a>
      </section>
    );
  }
  return (
    <section className="information-page section-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>{path.slice(1)}</span>
      </nav>
      <span className="eyebrow">TROPICAL FEAST / CLEAR AND SIMPLE</span>
      <h1>
        {path === "/privacy"
          ? "Privacy & storage."
          : path === "/terms"
            ? "Website terms."
            : "Let’s get in touch."}
      </h1>
      {path === "/privacy" ? (
        <>
          <p>
            Implementation notice · updated 25 October 2026. Trading name:{" "}
            {business.name}, Hyderabad, Telangana, India. The owner must supply
            the legal seller identity, physical address and a verified retention
            policy.{" "}
            <a href={email!} target="_blank" rel="noopener noreferrer">
              Contact by email
            </a>
            .
          </p>
          <h2>Your device and cookies</h2>
          <p>
            Guest carts store product IDs and quantities in localStorage until
            removed or site data is cleared. The guest-login dismissal is a
            non-sensitive sessionStorage preference (tf-guest-session-v1), not
            an authenticated session. A random cart-merge identifier may be held
            in sessionStorage to prevent duplicate merges. The store does not
            put delivery names, phone numbers or addresses in its guest-cart
            storage. Firebase may retain basic account profile details with its
            essential sign-in state.
          </p>
          <h2>Sign-in and saved account data</h2>
          <p>
            {authProvider === "firebase" ? "Firebase" : "Clerk"} checks your
            session on storefront visits and provides registration, sign-in and
            profile/security management. Google processes authentication if you
            choose Google login; we never receive your Google password.
            Essential sign-in storage works independently of optional analytics.
            The Firebase deployment uses essential IndexedDB/session storage for
            authentication state and a cached basic account profile. The Clerk
            deployment disables Clerk SDK telemetry. After real authentication,
            the store uses Neon PostgreSQL for your verified
            authentication-provider reference, name, verified email, optional
            phone, saved addresses, cart and enquiry history. Server endpoints
            scope these records to the verified session. Guest browsing and
            ordering remain available.
          </p>
          <h2>Enquiries and WhatsApp</h2>
          <p>
            Delivery details stay in memory until you choose Prepare WhatsApp
            enquiry. That action saves your name, phone, address, product and
            price snapshots, timestamps and an enquiry reference in Neon, for
            authorized business review. Opening WhatsApp or Gmail sends an
            editable draft in the destination URL to that provider; you must
            send it yourself. A redirect does not prove a message was sent and
            does not confirm an order. If storage fails, an explicitly labelled
            direct-message fallback does not save an enquiry here. Never include
            payment passwords or card details.
          </p>
          <h2>Owner access and hosting</h2>
          <p>
            The owner panel checks the authentication provider, a verified owner
            email and a server-checked panel password on every protected
            operation. Firebase owner access also requires the configured owner
            UID. Catalogue details and optimized photos use{" "}
            {authProvider === "firebase" ? "Netlify Blobs" : "Vercel Blob"}.
            Customer information and delivery settings use Neon.{" "}
            {authProvider === "firebase" ? "Netlify" : "Vercel"} processes
            hosting requests. A short-lived hashed network identifier is used
            for enquiry rate limits; expired counters are cleaned periodically.
            No payment gateway is connected.
          </p>
          <h2>Optional analytics and other forms</h2>
          <p>
            {siteConfig.analyticsId
              ? "Google Analytics loads only after explicit optional analytics consent."
              : "No analytics measurement ID is configured, so optional analytics is off."}{" "}
            Consent preferences use furity-consent-v1 for up to 180 days.
            Rejecting analytics does not sign you out or stop shopping. Form
            contents, phone, addresses and email are excluded from site
            analytics events. Newsletter signup appears only with a configured
            endpoint; a genuine successful response is required for
            confirmation. The owner must disclose that provider before enabling
            it.
          </p>
          <h2>Retention and deletion</h2>
          <p>
            Saved store records remain until you delete them through Your
            account or the owner handles a verified request. Delete my store
            data removes your saved addresses, account cart and linked store
            enquiries. Authentication-provider sign-in data is separate: use
            account security controls or request provider-side deletion. This
            cannot remove WhatsApp/email messages, provider logs or backups
            already held by their respective providers. Guest enquiry deletion
            requests go through the business email; the owner must verify
            identity and the reference. Backup/log retention and any legally
            required order retention need owner confirmation before commercial
            collection.
          </p>
          <h2>Archived demonstration</h2>
          <p>
            The separate fruit demo retains its local sample bag, saved fruit
            and sample receipts. It processes no real payment or order and
            stores no customer contact data in receipts.
          </p>
          <button
            className="button primary"
            onClick={() => {
              try {
                for (const k of [
                  "fruity-pickle-selection-v1",
                  "fruity-pickle-quantities-v1",
                  "furity-cart-v1",
                  "furity-saved-v1",
                  "furity-receipts-v1",
                  "furity-consent-v1",
                ])
                  localStorage.removeItem(k);
                for (const k of [
                  "tf-guest-session-v1",
                  "tf-cart-merge-v1",
                  "furity-newsletter-confirmed",
                ])
                  sessionStorage.removeItem(k);
                window.location.reload();
              } catch {
                setError(
                  "Use your browser’s site-data settings to clear local data.",
                );
              }
            }}
          >
            Clear this site’s browser data
          </button>
          <p>
            This does not delete your server account or sign you out.{" "}
            <a href="/account">Manage store data and sign-in</a>.
          </p>
          <p role="status">{error}</p>
        </>
      ) : path === "/terms" ? (
        <>
          <p className="demo-banner">
            Editable terms: owner legal review and completion are required
            before commercial launch.
          </p>
          <h2>Products and pricing</h2>
          <p>
            Tropical Feast offers homemade pickles in Hyderabad. The initial
            cucumber and pineapple products are 200 g jars at ₹149 each. Current
            cart prices reflect the catalogue; the owner may update them. Prices
            are visible before you provide delivery details. Ingredients,
            allergens, storage, shelf life and stock must be confirmed with the
            business where not supplied.
          </p>
          <h2>Enquiries are not orders</h2>
          <p>
            Saving a cart, preparing an enquiry or opening a WhatsApp draft is
            not a confirmed purchase. The business must accept the enquiry and
            confirm availability, delivery coverage, charge, payable total and
            payment arrangements directly. Only the authorized business can mark
            an order confirmed or fulfilled. No online payment is collected here
            and no cash-on-delivery service is promised.
          </p>
          <h2>Delivery</h2>
          <p>
            Standard delivery is ₹150 per order. Confirm coverage and timing on
            WhatsApp. Configured area rates, any eligible free-delivery
            threshold and delivery timing are estimates until the business
            confirms them. A valid PIN format alone does not establish service
            availability. No delivery outside confirmed Hyderabad service areas
            is promised.
          </p>
          <h2>Accounts and privacy</h2>
          <p>
            Guest enquiries are welcome. Sign-in uses{" "}
            {authProvider === "firebase" ? "Firebase" : "Clerk"}; saved store
            data uses Neon when configured. Keep account access secure. The
            owner panel is restricted separately on the server. See{" "}
            <a href="/privacy">privacy and storage</a> for deletion controls and
            providers.
          </p>
          <h2>Commercial terms still required</h2>
          <p>
            The owner must publish the legal seller identity and address, tax
            treatment, accepted payment arrangements, cancellation conditions,
            damaged-jar process, return/refund eligibility and timeframes, and
            applicable dispute process. None is invented here. Statutory rights
            that cannot be excluded are not waived by this template.
          </p>
        </>
      ) : (
        <>
          <p>{business.tagline}</p>
          <dl className="contact-details">
            <dt>Trading brand</dt>
            <dd>{business.name} · Homemade pickles</dd>
            <dt>Location</dt>
            <dd>{business.location}</dd>
            <dt>Business hours</dt>
            <dd>{business.hours}</dd>
            <dt>Email</dt>
            <dd>
              <a href={email!} target="_blank" rel="noopener noreferrer">
                Contact by email ↗
              </a>
            </dd>
            <dt>WhatsApp</dt>
            <dd>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp ↗
                </a>
              ) : (
                "Ordering channel unavailable"
              )}
            </dd>
            <dt>Instagram</dt>
            <dd>
              <a
                href={business.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                @tropicalfeast.pickles ↗
              </a>
            </dd>
            <dt>Physical business address</dt>
            <dd>
              {siteConfig.address ||
                "Not yet supplied. Hyderabad is the service location, not a published street address."}
            </dd>
          </dl>
          <p>
            Standard delivery is ₹150 per order. Confirm coverage and timing on
            WhatsApp. Enquiries need direct business confirmation before an
            order is accepted.
          </p>
          <h2>Owner details to complete</h2>
          <p>
            Confirm legal seller identity, physical address,
            ingredients/allergens, shelf life, delivery areas/timing and
            cancellation/return/refund terms before commercial launch.
          </p>
          <a href="/privacy">Privacy notice</a> ·{" "}
          <a href="/terms">Website terms</a>
        </>
      )}
    </section>
  );
}
