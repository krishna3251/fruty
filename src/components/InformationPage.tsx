import { useState } from "react";
import { siteConfig } from "../lib/config";
export default function InformationPage({ path }: { path: string }) {
  const [storageError, setStorageError] = useState("");
  if (path === "/thank-you") {
    let confirmed = false;
    try {
      const time = Number(
        sessionStorage.getItem("furity-newsletter-confirmed"),
      );
      confirmed = time > 0 && Date.now() - time < 30 * 60000;
    } catch {
      /* No confirmation without a verified session marker. */
    }
    return (
      <section className="information-page section-pad">
        <span className="eyebrow">NEWSLETTER STATUS</span>
        <h1>
          {confirmed ? "Thanks for subscribing." : "No signup to confirm."}
        </h1>
        <p>
          {confirmed
            ? "The configured newsletter service confirmed your signup. Check your inbox for any follow-up sent by that service."
            : "We have not verified a newsletter submission in this session. You can return to the homepage to check signup availability."}
        </p>
        <a className="button primary" href="/">
          Back to the fruit collection ↗
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
      <span className="eyebrow">FURITY / CLEAR AND SIMPLE</span>
      <h1>
        {path === "/privacy"
          ? "Privacy & storage."
          : path === "/terms"
            ? "Website terms."
            : "Let’s get in touch."}
      </h1>
      <p className="policy-intro">
        {path === "/contact"
          ? "Business contact details will appear here once the owner supplies them."
          : "Implementation notice for this demonstration website. Updated 22 October 2026."}
      </p>
      {path === "/privacy" ? (
        <>
          <h2>Who operates this website?</h2>
          <p>
            {siteConfig.businessName ||
              "Business/legal name: not supplied by the owner."}{" "}
            Privacy contact:{" "}
            {siteConfig.email ? (
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            ) : (
              "not supplied. The owner must provide a working privacy contact before collecting personal information commercially."
            )}
          </p>
          <h2>What stays on your device</h2>
          <p>
            The bag (furity-cart-v1), saved fruit (furity-saved-v1), and sample
            receipts (furity-receipts-v1) use localStorage. They remain until
            you clear them or your browser removes site data. Demo receipts
            contain a sample ID, date, product IDs, quantities and estimated
            total; they contain no contact/address details.
          </p>
          <h2>Collection enquiries</h2>
          <p>
            Tropical Feast has a separately configurable external direct-message
            channel. Following that link, when available, takes you to the
            configured provider; this website does not send your message or
            contact details automatically. The supplier and provider must
            confirm how they handle enquiries. Fermented Pickles has no verified
            enquiry channel. Shared ownership of these collections has not been
            established.
          </p>
          <h2>Forms and checkout</h2>
          <p>
            Checkout fields stay in memory while the checkout is open; no order,
            payment or address is sent to a server. Newsletter signup is
            disabled unless an HTTPS endpoint is configured. When configured,
            submitting sends your email to that endpoint; confirmation requires
            its successful response. A short-lived confirmation marker is saved
            in sessionStorage. The owner must disclose the newsletter provider
            and its actual retention policy before enabling it.
          </p>
          <h2>Optional analytics and cookies</h2>
          <p>
            {siteConfig.analyticsId
              ? "Google Analytics is configured but loads only after you explicitly allow it in preferences."
              : "No analytics measurement ID is currently configured; no optional analytics tag is loaded."}{" "}
            If enabled and accepted, GA4 receives page paths and product/CTA
            events, and may use first-party _ga cookies (configured lifetime:
            180 days). Form contents, addresses, email, phone and URL query
            parameters are excluded from our event payloads. Google may process
            network/device information under its own policies. Advertising
            features are disabled.
          </p>
          <p>
            Consent choices use furity-consent-v1 for 180 days. Rejecting
            optional analytics does not prevent shopping. Preferences can be
            reopened in the footer. Hosting on Vercel involves standard request
            processing; the owner must confirm any hosting-log retention
            settings. No advertising pixel, embedded social feed or third-party
            font service is used.
          </p>
          <h2>Control and retention</h2>
          <p>
            You can remove browser data below. This does not delete any
            information already sent to a configured newsletter or analytics
            provider. Use the owner’s privacy contact for provider-side requests
            once supplied. No claim of compliance with a particular privacy law
            is made.
          </p>
          <button
            className="button primary"
            onClick={() => {
              try {
                for (const key of [
                  "furity-cart-v1",
                  "furity-saved-v1",
                  "furity-receipts-v1",
                  "furity-consent-v1",
                ])
                  localStorage.removeItem(key);
                sessionStorage.removeItem("furity-newsletter-confirmed");
                window.location.reload();
              } catch {
                setStorageError(
                  "Browser storage could not be cleared here. Use your browser’s site-data settings.",
                );
              }
            }}
          >
            Clear this site’s browser data
          </button>
          <p role="status">{storageError}</p>
        </>
      ) : path === "/terms" ? (
        <>
          <div className="demo-banner">
            <p>
              Editable pre-launch terms template. The owner must confirm
              business details and obtain legal review before commercial
              publication.
            </p>
          </div>
          <h2>Using this demonstration</h2>
          <p>
            Furity currently demonstrates fruit browsing, saved items and a
            sample shopping bag. Product prices, origin, availability, shipping
            estimates, discounts and fictional reviews are illustrative. They
            are not an offer to supply goods.
          </p>
          <h2>Orders, payments and accounts</h2>
          <p>
            No purchase contract is formed through the demo checkout. No real
            payment, order fulfillment, delivery reservation, inventory
            allocation or account sign-in is connected. A demo receipt is not a
            tax invoice or order confirmation.
          </p>
          <h2>Before live sales begin</h2>
          <p>
            The owner must publish the verified seller identity, service area,
            total price/tax rules, payment methods, delivery charges and times,
            cancellation conditions, damaged-produce process, return
            eligibility, refund process/timeframes, customer support and
            applicable jurisdiction. These commercial terms are not yet provided
            and no delivery/refund guarantee is represented here.
          </p>
          <h2>Content and availability</h2>
          <p>
            Use the site lawfully. The owner must secure rights to fruit
            photography and other assets before commercial use. Features may
            change or be temporarily unavailable; statutory rights that cannot
            lawfully be excluded are not purported to be waived by this
            template.
          </p>
          <h2>Questions and business identity</h2>
          <p>
            See the <a href="/contact">contact page</a> for configured details.
            Governing law, legal business name, physical address and applicable
            dispute process require owner confirmation.
          </p>
        </>
      ) : (
        <>
          <dl className="contact-details">
            <dt>Business/legal name</dt>
            <dd>
              {siteConfig.businessName ||
                "Not provided — owner configuration required"}
            </dd>
            <dt>Email</dt>
            <dd>
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.email) ? (
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              ) : (
                "Not provided — no support email is published"
              )}
            </dd>
            <dt>Phone</dt>
            <dd>
              {/^\+?[\d\s()-]{7,25}$/.test(siteConfig.phone) ? (
                <a href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}>
                  {siteConfig.phone}
                </a>
              ) : (
                "Not provided — no support phone is published"
              )}
            </dd>
            <dt>Physical address</dt>
            <dd>
              {siteConfig.address ||
                "Not provided — no business address is published"}
            </dd>
          </dl>
          <h2>Service status</h2>
          <p>
            This is a demonstration storefront. Delivery, customer support
            operations, returns and real order processing are not connected. No
            response-time promise or company registration is implied.
          </p>
          <h2>Owner completion checklist</h2>
          <p>
            Supply the legal/trading name, monitored support and privacy email,
            telephone, physical business address, support hours and delivery
            area. Verify the details before enabling live commerce.
          </p>
          <a href="/privacy">Privacy notice</a> ·{" "}
          <a href="/terms">Website terms</a>
        </>
      )}
    </section>
  );
}
