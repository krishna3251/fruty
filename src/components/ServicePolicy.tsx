import { useBusiness } from "../context/Business";
import { DELIVERY_NOTICE } from "../lib/business";
import { enquiryWhatsApp, enquiryGmail } from "../lib/contact";
export default function ServicePolicy({
  returns = false,
}: {
  returns?: boolean;
}) {
  const business = useBusiness();
  const whatsapp = enquiryWhatsApp(
    undefined,
    `https://wa.me/${business.whatsapp}`,
  );
  const email = enquiryGmail(undefined, business.email);
  return (
    <section className="information-page section-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>{returns ? "Order support" : "Shipping & delivery"}</span>
      </nav>
      <span className="eyebrow">TROPICAL FEAST / BEFORE YOU ORDER</span>
      <h1>
        {returns ? "A problem with your jar?" : "From our pantry to yours."}
      </h1>
      {returns ? (
        <>
          <h2>Cancellations, damaged jars & refunds</h2>
          <p>
            Contact the business with your enquiry reference and a description
            of the issue. Keep the packaging and relevant photos available to
            share directly with the seller. This site does not upload support
            photos or automatically issue refunds.
          </p>
          <p>
            Cancellation eligibility, returns, refund methods and timeframes
            have not yet been supplied by the owner. Ask for these terms before
            confirming an order or making payment. No blanket no-return policy
            is assumed, and applicable statutory rights are not waived.
          </p>
          <h2>If you have only opened a WhatsApp draft</h2>
          <p>
            Opening a draft or preparing an enquiry does not place a confirmed
            order or take payment. If you already sent the message, contact the
            business to check its status. Your saved cart remains available.
          </p>
        </>
      ) : (
        <>
          <h2>Hyderabad enquiries</h2>
          <p>
            {DELIVERY_NOTICE} A valid PIN format does not guarantee that your
            address is serviceable. No delivery outside confirmed Hyderabad
            areas is promised.
          </p>
          <h2>One delivery charge per order</h2>
          <p>
            The cart shows the ₹150 standard charge before asking for your
            details. Any owner-configured PIN rate or eligible free-delivery
            offer is shown in your address review. The seller must confirm
            coverage, availability and the final amount before accepting your
            request.
          </p>
          <h2>Timing and payment</h2>
          <p>
            {business.deliveryEstimate ||
              "Delivery times have not been confirmed. Ask the business for an estimate for your address."}{" "}
            No online payment is collected here. Agree payment arrangements
            directly with the seller before paying.
          </p>
        </>
      )}
      <h2>Talk to the business</h2>
      <p>{business.hours}</p>
      <div className="policy-contact-actions">
        {whatsapp && (
          <a
            className="button primary"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp support ↗
          </a>
        )}
        {email && (
          <a
            className="button outline"
            href={email}
            target="_blank"
            rel="noopener noreferrer"
          >
            Email support ↗
          </a>
        )}
      </div>
      <p>
        <a href="/shop">Browse pickles</a> · <a href="/terms">Website terms</a>{" "}
        · <a href="/contact">Contact information</a>
      </p>
    </section>
  );
}
