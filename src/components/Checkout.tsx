import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Tag,
  ChevronLeft,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { products, money, asset } from "../data/products";
import {
  estimate,
  validateCheckout,
  type CheckoutFields,
  type DemoReceipt,
} from "../lib/store";
const empty: CheckoutFields = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  pin: "",
};
export default function Checkout({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (receipt: DemoReceipt) => void;
}) {
  const cart = useCart();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(empty);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutFields, string>>
  >({});
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [couponError, setCouponError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<DemoReceipt | null>(null);
  const costs = estimate(cart.subtotal, applied);
  const choices = products.filter((p) => cart.items[p.id]);
  const advance = () => {
    const next = validateCheckout(fields);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setStep(2);
  };
  const complete = async () => {
    if (busy || !cart.count) return;
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const receipt: DemoReceipt = {
      id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      created: new Date().toISOString(),
      total: costs.total,
      items: choices.map((p) => ({ id: p.id, quantity: cart.items[p.id] })),
    };
    onComplete(receipt);
    setDone(receipt);
    setBusy(false);
  };
  if (done)
    return (
      <div className="checkout-success">
        <div className="success-orbit">
          <CheckCircle2 size={46} />
        </div>
        <span className="eyebrow">A PERFECT PRACTICE PICK</span>
        <h3>
          Goodness looks
          <br />
          good on you.
        </h3>
        <p>Demo complete!</p>
        <strong>{done.id}</strong>
        <p>
          No order was placed, no payment was taken, and your bag is still here.
        </p>
        <small>
          A sample receipt was saved on this device. No address or contact
          details were stored.
        </small>
        <button className="button primary" onClick={onBack}>
          Back to your bag <ArrowRight size={18} />
        </button>
      </div>
    );
  return (
    <div className="checkout-flow">
      <div className="checkout-steps">
        <span className={step === 1 ? "current" : ""}>
          01 <b>Your details</b>
        </span>
        <i />
        <span className={step === 2 ? "current" : ""}>
          02 <b>Review & finish</b>
        </span>
      </div>
      <div className="demo-banner">
        <ShieldCheck size={18} />
        <p>
          Try the full checkout flow using sample details. No real order,
          payment, or delivery is created.
        </p>
      </div>
      {step === 1 ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            advance();
          }}
        >
          <div className="form-heading">
            <h3>Where’s your fruit bowl?</h3>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setFields({
                  name: "Fruit Lover",
                  email: "demo@example.test",
                  phone: "9876543210",
                  address: "12 Sample Garden Road",
                  city: "Hyderabad",
                  pin: "500001",
                });
                setErrors({});
              }}
            >
              Use sample details
            </button>
          </div>
          <div className="checkout-fields">
            {(
              [
                { id: "name", label: "Full name", type: "text", auto: "name" },
                {
                  id: "email",
                  label: "Email address",
                  type: "email",
                  auto: "email",
                },
                {
                  id: "phone",
                  label: "Mobile number",
                  type: "tel",
                  auto: "tel-national",
                },
                {
                  id: "pin",
                  label: "PIN code",
                  type: "text",
                  auto: "postal-code",
                },
                {
                  id: "address",
                  label: "House & street address",
                  type: "text",
                  auto: "street-address",
                },
                {
                  id: "city",
                  label: "City",
                  type: "text",
                  auto: "address-level2",
                },
              ] as const
            ).map((f) => (
              <label
                key={f.id}
                className={`field field-${f.id}`}
                htmlFor={`checkout-${f.id}`}
              >
                <span>
                  {f.label} <i>*</i>
                </span>
                <input
                  id={`checkout-${f.id}`}
                  type={f.type}
                  autoComplete={f.auto}
                  inputMode={f.id === "pin" ? "numeric" : undefined}
                  maxLength={f.id === "pin" ? 6 : f.id === "phone" ? 14 : 150}
                  value={fields[f.id]}
                  aria-invalid={!!errors[f.id]}
                  aria-describedby={errors[f.id] ? `error-${f.id}` : undefined}
                  onChange={(e) => {
                    setFields({ ...fields, [f.id]: e.target.value });
                    if (errors[f.id])
                      setErrors({ ...errors, [f.id]: undefined });
                  }}
                />
                {errors[f.id] && (
                  <small id={`error-${f.id}`} role="alert">
                    {errors[f.id]}
                  </small>
                )}
              </label>
            ))}
          </div>
          <div className="delivery-option">
            <Truck size={20} />
            <div>
              <strong>Standard delivery · sample estimate</strong>
              <span>2–3 days · no serviceability or delivery is connected</span>
            </div>
            <b>{costs.delivery ? money(costs.delivery) : "Free"}</b>
          </div>
          <button className="button primary full">
            Review your harvest <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <>
          <div className="review-address">
            <span className="eyebrow">CONTACT & DELIVERY</span>
            <p>
              {fields.name} · {fields.phone}
              <br />
              {fields.address}, {fields.city} {fields.pin}
            </p>
            <button className="text-link" onClick={() => setStep(1)}>
              Edit details
            </button>
          </div>
          <h3 className="review-heading">Your harvest</h3>
          {choices.map((p) => (
            <div className="checkout-product" key={p.id}>
              <img src={asset(p.image)} alt="" width="65" height="65" />
              <span>
                {p.name} × {cart.items[p.id]}
                <small>{p.weight}</small>
              </span>
              <strong>{money(p.price * cart.items[p.id])}</strong>
            </div>
          ))}
          <form
            className="coupon-form"
            onSubmit={(e) => {
              e.preventDefault();
              const code = coupon.trim().toUpperCase();
              if (code === "FRESH10") {
                setApplied(code);
                setCouponError("");
              } else {
                setCouponError(
                  "That code isn’t valid. Try FRESH10 for this demo.",
                );
              }
            }}
          >
            <label htmlFor="coupon">
              <Tag size={16} />
              <span className="sr-only">Promo code</span>
              <input
                id="coupon"
                placeholder="Promo code · try FRESH10"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                aria-invalid={!!couponError}
                aria-describedby="coupon-status"
                maxLength={30}
              />
            </label>
            <button type="submit">Apply</button>
          </form>
          <p
            className={couponError ? "form-error" : "coupon-success"}
            id="coupon-status"
            role="status"
          >
            {couponError ||
              (applied ? "FRESH10 applied: 10% off, up to ₹150." : "")}
          </p>
          <div className="checkout-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(costs.subtotal)}</span>
            </div>
            <div>
              <span>
                Delivery estimate {costs.delivery === 0 ? "· ₹799+ bag" : ""}
              </span>
              <span>{costs.delivery ? money(costs.delivery) : "Free"}</span>
            </div>
            {costs.discount > 0 && (
              <div>
                <span>Demo discount</span>
                <span>−{money(costs.discount)}</span>
              </div>
            )}
            <div className="grand-total">
              <strong>Estimated total</strong>
              <strong>{money(costs.total)}</strong>
            </div>
          </div>
          <small className="demo-disclaimer">
            Illustrative prices only. No additional charges or real payments.
          </small>
          <button
            className="button primary full"
            disabled={busy || !cart.count}
            onClick={complete}
          >
            {busy ? "Preparing your demo receipt…" : "Finish demo checkout"}
            <ArrowRight size={18} />
          </button>
          <button
            className="text-link centered"
            disabled={busy}
            onClick={() => setStep(1)}
          >
            <ChevronLeft size={15} /> Back to details
          </button>
        </>
      )}
      <button className="text-link centered" disabled={busy} onClick={onBack}>
        Back to bag
      </button>
    </div>
  );
}
