import { useState } from "react";
import { Plus, Minus, ArrowUpRight, Leaf, Search } from "lucide-react";
const questions = [
  [
    "How fresh is fresh?",
    "Our concept is simple: seasonal produce, clear origin information and helpful storage tips. The products shown are sample selections; a live sourcing and inventory service is not connected yet.",
  ],
  [
    "Where do you deliver?",
    "Delivery is not connected in this demo. You can try a sample checkout with a valid-format Indian PIN code, but that does not confirm serviceability or reserve a delivery slot.",
  ],
  [
    "Can I shop without an account?",
    "Yes. Browse, save favorites and try guest checkout. Your bag, favorites and sample receipts stay on this browser; there is no account sign-in service.",
  ],
  [
    "What happens after checkout?",
    "You receive a clearly labeled demo receipt on this device. No real order is placed and no payment is collected. Address and contact fields are kept only while the checkout is open.",
  ],
];
export default function MarketExtras() {
  const [open, setOpen] = useState<number | null>(0);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  return (
    <>
      <section className="market-journal section-pad">
        <div>
          <span className="eyebrow">THE SLOW LIVING EDIT</span>
          <h2>
            Little rituals.
            <br />
            <em>Lovely days.</em>
          </h2>
          <p>
            A bowl of berries. A sunny windowsill.
            <br />
            Good food doesn’t need to be complicated.
          </p>
          <a href="#shop" className="text-link">
            Make room for a little fresh <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="journal-grid">
          <article className="journal-card journal-pink">
            <span>01 / THE FIVE-MINUTE MORNING</span>
            <div className="journal-fruit">
              <img
                src="/images/strawberry.webp"
                width="250"
                height="250"
                alt="Ripe strawberry"
                loading="lazy"
              />
            </div>
            <h3>
              Your everyday
              <br />
              berry ritual.
            </h3>
            <p>Yogurt, a handful of berries, and a slow start.</p>
          </article>
          <article className="journal-card journal-sage">
            <span>02 / KEEP THE GOODNESS GOING</span>
            <div className="journal-fruit">
              <img
                src="/images/avocado.webp"
                width="250"
                height="250"
                alt="Avocado halves"
                loading="lazy"
              />
            </div>
            <h3>
              A little care.
              <br />A little longer.
            </h3>
            <p>Find storage tips on every product page.</p>
          </article>
        </div>
      </section>
      <section className="faq-section section-pad" id="help">
        <div>
          <span className="eyebrow">A FEW FRESH ANSWERS</span>
          <h2>
            Good questions.
            <br />
            <em>Simple answers.</em>
          </h2>
          <div className="pin-check">
            <Leaf size={24} />
            <h3>Start with your neighborhood.</h3>
            <p>
              Try the PIN format checker. Delivery coverage isn’t connected yet.
            </p>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setMessage(
                  /^[1-9]\d{5}$/.test(pin)
                    ? "Valid PIN format. Delivery serviceability is not connected yet."
                    : "Please enter a 6-digit PIN code starting with 1–9.",
                );
              }}
            >
              <label className="sr-only" htmlFor="delivery-pin">
                Delivery PIN code
              </label>
              <input
                id="delivery-pin"
                inputMode="numeric"
                maxLength={6}
                placeholder="Your 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button aria-label="Check PIN format">
                <Search size={18} />
              </button>
            </form>
            <span role="status">{message}</span>
          </div>
        </div>
        <div className="faq-list">
          {questions.map(([q, a], i) => (
            <article key={q}>
              <button
                aria-expanded={open === i}
                aria-controls={`answer-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{q}</span>
                {open === i ? <Minus size={19} /> : <Plus size={19} />}
              </button>
              <div id={`answer-${i}`} hidden={open !== i}>
                <p>{a}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
