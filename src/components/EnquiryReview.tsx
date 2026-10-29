import { useState, useRef, useEffect } from "react";
import { useSession } from "../context/Session";
import { useBusiness } from "../context/Business";
import { customerApi } from "../lib/customerApi";
import {
  emptyAddress,
  validateAddress,
  orderMessage,
  deliveryQuote,
  type Address,
  snapshotItems,
} from "../lib/customer";
import { type PickleProduct } from "../data/pickles";
import AddressFields from "./AddressFields";
import { money } from "../data/products";
import EmailEnquiry from "./EmailEnquiry";
export default function EnquiryReview({
  products,
  items,
  startAtDetails = false,
  onBackToCart,
}: {
  products: PickleProduct[];
  items: Record<string, number>;
  startAtDetails?: boolean;
  onBackToCart?: () => void;
}) {
  const session = useSession();
  const settings = useBusiness();
  const [step, setStep] = useState<"cart" | "details" | "review">(
    startAtDetails ? "details" : "cart",
  );
  const [address, setAddress] = useState<Address>({ ...emptyAddress });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [result, setResult] = useState<{
    reference: string;
    message: string;
    url: string | null;
    subtotal: number;
    delivery: number | null;
    total: number | null;
  } | null>(null);
  const requestId = useRef("");
  const signatures = JSON.stringify({
    items,
    prices: products.map((p) => [p.id, p.price, p.jarSize]),
  });
  const latestContents = useRef(signatures);
  latestContents.current = signatures;
  useEffect(() => {
    setResult(null);
    requestId.current = "";
    setStep(startAtDetails ? "details" : "cart");
  }, [signatures, startAtDetails]);
  useEffect(() => {
    if (session.status !== "signed-in") {
      setAddresses([]);
      return;
    }
    let active = true;
    void customerApi("/api/customer", { action: "load" }, session.getToken)
      .then((d) => {
        if (active) setAddresses(d.addresses);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session.userId, session.status]);
  const lines = snapshotItems(items, products);
  const subtotal = lines.reduce((n, p) => n + p.quantity * p.price, 0);
  const quote = deliveryQuote(settings, address.pin, subtotal);
  const fallback = orderMessage({
    reference: "Not saved — direct enquiry",
    customer: address,
    items: lines,
    subtotal,
    delivery: quote.delivery,
  });
  if (step === "cart")
    return (
      <div className="review-entry">
        <p>
          ₹150 standard delivery is included in the estimate above. Confirm
          coverage and the final amount with the seller.
        </p>
        <button className="button primary" onClick={() => setStep("details")}>
          Review & enquire on WhatsApp ↗
        </button>
        <p>Guest ordering is welcome. No online payment.</p>
      </div>
    );
  return (
    <section className="enquiry-review">
      <h3>
        {step === "details"
          ? "Where’s your jar headed?"
          : "Your enquiry, ready to review."}
      </h3>
      <p className="form-error" role="alert">
        {error}
      </p>
      {step === "details" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              setAddress(validateAddress(address));
              setError("");
              setStep("review");
              setResult(null);
              requestId.current = "";
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          {addresses.length > 0 && (
            <label>
              Use a saved address
              <select
                defaultValue=""
                onChange={(e) => {
                  const a = addresses.find((a) => a.id === e.target.value);
                  if (a) setAddress(a);
                }}
              >
                <option value="">Enter a new address</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} · {a.pin}
                  </option>
                ))}
              </select>
            </label>
          )}
          <AddressFields value={address} onChange={setAddress} />
          <p>
            Your details stay in memory until you prepare an enquiry. That step
            saves them securely for the business to review.{" "}
            <a href="/privacy">Privacy</a>
          </p>
          <button className="button primary">Review details</button>
        </form>
      ) : (
        <>
          <p>
            {address.recipient}
            <br />
            {address.street}, {address.locality}, Hyderabad {address.pin}
          </p>
          <ul>
            {lines.map((i) => (
              <li key={i.id}>
                {i.quantity} × {i.name} · {i.jarSize || "size to confirm"} ·{" "}
                {money(i.price)} each
              </li>
            ))}
          </ul>
          <p>
            <strong>Products {money(subtotal)}</strong>
            <br />
            Delivery:{" "}
            {quote.delivery === null
              ? "To be confirmed"
              : `${money(quote.delivery)} configured estimate — confirm in chat`}
            <br />
            Estimated total:{" "}
            {quote.total === null ? "To be confirmed" : money(quote.total)}
          </p>
          {settings.deliveryEstimate && quote.coverage === "configured" && (
            <p>
              Estimated delivery: {settings.deliveryEstimate}. Confirm timing
              with the business.
            </p>
          )}
          {!settings.whatsapp && (
            <p role="alert">
              WhatsApp ordering is unavailable. Contact the business by email or
              try again later.
            </p>
          )}
          {!result ? (
            <button
              className="button primary"
              disabled={busy || !settings.whatsapp}
              onClick={async () => {
                if (pending.current) return;
                pending.current = true;
                setBusy(true);
                setError("");
                try {
                  if (!requestId.current)
                    requestId.current = crypto.randomUUID();
                  const preparedContents = latestContents.current;
                  const d = await customerApi(
                    "/api/enquiry",
                    { requestId: requestId.current, customer: address, items },
                    session.getToken,
                  );
                  if (preparedContents === latestContents.current) setResult(d);
                  else
                    setError(
                      "Your cart changed. Review the current items before preparing another enquiry.",
                    );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  pending.current = false;
                  setBusy(false);
                }
              }}
            >
              {busy ? "Preparing enquiry…" : "Prepare WhatsApp enquiry"}
            </button>
          ) : (
            <div className="enquiry-ready" role="status">
              <strong>Enquiry {result.reference} saved for review.</strong>
              <p>
                Current server-verified products subtotal:{" "}
                {money(result.subtotal)}. Delivery:{" "}
                {result.delivery === null
                  ? "To be confirmed"
                  : money(result.delivery)}
                . Estimated total:{" "}
                {result.total === null
                  ? "To be confirmed"
                  : money(result.total)}
                . The seller must confirm availability and coverage.
              </p>
              <details>
                <summary>Review the exact message</summary>
                <textarea
                  aria-label="Prepared WhatsApp message"
                  readOnly
                  value={result.message}
                  rows={10}
                />
              </details>
              <p>
                It is not a confirmed order. Open WhatsApp, review and send the
                draft yourself.
              </p>
              {result.url ? (
                <a
                  className="basket-contact whatsapp-contact"
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open WhatsApp ↗
                </a>
              ) : (
                <p>WhatsApp ordering is temporarily unavailable.</p>
              )}
              <button
                className="text-link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.message);
                    setCopyStatus(
                      "Enquiry copied. Review and send it yourself.",
                    );
                  } catch {
                    setCopyStatus(
                      "Copy unavailable. Select the exact message above and copy it manually.",
                    );
                  }
                }}
              >
                Copy order request
              </button>
              <p role="status">{copyStatus}</p>
              <EmailEnquiry
                message={result.message}
                label="Email enquiry instead"
                prominent
              />
            </div>
          )}
          {error && (
            <details>
              <summary>Storage unavailable? Enquire directly</summary>
              <p>
                This fallback does not save an enquiry or create a reference.
                Review and send it yourself.
              </p>
              <a
                className="basket-contact whatsapp-contact"
                href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(fallback)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open direct WhatsApp draft ↗
              </a>
              <EmailEnquiry message={fallback} label="Email" prominent />
            </details>
          )}
        </>
      )}
      <button
        className="text-link"
        disabled={busy}
        onClick={() => {
          if (step === "details" && onBackToCart) {
            onBackToCart();
            return;
          }
          setStep(step === "review" ? "details" : "cart");
          setResult(null);
          setError("");
        }}
      >
        Back to {step === "review" ? "delivery details" : "cart"}
      </button>
    </section>
  );
}
