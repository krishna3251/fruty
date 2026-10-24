import { useCatalogue } from "../context/Catalogue";
import { cartTotals } from "../lib/catalogue";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Trash2,
  Minus,
  Plus,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { collectionFor, pickleCollections } from "../data/pickles";
import { usePickleSelection } from "../context/PickleSelection";
import { enquiryWhatsApp } from "../lib/contact";
import EmailEnquiry from "./EmailEnquiry";
import { MAX_ENQUIRY_QUANTITY } from "../context/PickleSelection";
import { money } from "../data/products";
export default function EnquiryList({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { products: pickleProducts, error: catalogueError } = useCatalogue();
  const selection = usePickleSelection();
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const copyingRef = useRef(false);
  if (!selection) return null;
  const selected = pickleProducts.filter((p) => selection.ids.includes(p.id));
  const { subtotal, delivery, total } = cartTotals(
    selected,
    selection.quantities,
  );
  const missing = selection.ids.filter(
    (id) => !pickleProducts.some((p) => p.id === id),
  );
  const unavailable = selected.some(
    (p) => p.availability === "unavailable" || p.price === null,
  );
  const message = [
    "Hello, I’d like to enquire about:",
    ...selected.map(
      (p) =>
        `• ${selection.quantities[p.id] || 1} × ${p.name} — ${collectionFor(p).name} — ${money(p.price!)} each`,
    ),
    `Products subtotal: ${money(subtotal)}`,
    `Delivery: ${money(delivery)}`,
    `Total: ${money(total)}`,
    "Please confirm jar sizes, ingredients/allergens, stock, delivery details and the final total before I order.",
  ].join("\n");
  const dm = enquiryWhatsApp(message);
  return (
    <div
      className={`enquiry-list ${selected.length ? "has-items" : "is-empty"}`}
    >
      <p className="basket-intro">
        Pick your jars. We’ll help with the rest.{" "}
        <span>₹150 delivery · Hyderabad enquiries</span>
      </p>
      {catalogueError && <p role="status">{catalogueError}</p>}
      {missing.length > 0 && (
        <div role="status">
          Some saved products are no longer in this catalogue.{" "}
          {missing.map((id) => (
            <button
              className="text-link"
              key={id}
              onClick={() => selection.toggle(id)}
            >
              Remove missing item
            </button>
          ))}
        </div>
      )}
      {unavailable && (
        <p role="alert">
          An item is unavailable. Remove it before sending your enquiry.
        </p>
      )}
      {selection.storageUnavailable && (
        <p role="status">
          Browser storage is unavailable. Your list lasts for this visit only.
        </p>
      )}
      {!selected.length ? (
        <div className="enquiry-empty">
          <ShoppingBag size={28} aria-hidden="true" />
          <h3>A little tang is waiting.</h3>
          <p>
            Start with a flavour below. Your favourites stay saved on this
            device.
          </p>
          <div className="basket-suggestions">
            {pickleProducts.map((p) => (
              <button
                key={p.id}
                className="basket-suggestion"
                onClick={() => selection.add(p.id)}
                disabled={p.availability === "unavailable" || p.price === null}
                aria-label={`Add to cart: ${p.name}`}
              >
                <img src={p.image} alt={p.imageAlt} width="160" height="110" />
                <span>{p.name}</span>
                <small>
                  {p.price === null ? "Price on enquiry" : money(p.price)}{" "}
                  <Plus size={15} />
                </small>
              </button>
            ))}
          </div>
          <a href="/shop" className="basket-continue" onClick={onNavigate}>
            Explore pickles <ArrowUpRight size={17} />
          </a>
        </div>
      ) : (
        <>
          <div className="basket-products">
            {pickleCollections.map((c) => {
              const items = selected.filter((p) => p.collectionId === c.id);
              return items.length ? (
                <section key={c.id} className="enquiry-group">
                  <h3>{c.name}</h3>
                  {items.map((p) => (
                    <div className="enquiry-item" key={p.id}>
                      <a
                        className="basket-product-image"
                        onClick={onNavigate}
                        href={`/products/${p.id}`}
                        aria-label={`View ${p.name}`}
                      >
                        <img
                          src={p.image}
                          alt={p.imageAlt}
                          width="100"
                          height="110"
                        />
                      </a>
                      <div className="basket-product-info">
                        <a href={`/products/${p.id}`} onClick={onNavigate}>
                          {p.name}
                        </a>
                        <small>
                          {p.flavourDescriptors.join(" · ")}
                          {p.availability === "unavailable"
                            ? " · Unavailable"
                            : ""}
                        </small>
                        <strong className="basket-unit-price">
                          {money(p.price!)} <span>/ jar · size to confirm</span>
                        </strong>
                        <div
                          className="enquiry-quantity"
                          aria-label={`${p.name} quantity controls`}
                        >
                          <button
                            className="icon-button"
                            aria-label={`Decrease ${p.name} quantity`}
                            disabled={(selection.quantities[p.id] || 1) <= 1}
                            onClick={() =>
                              selection.setQuantity(
                                p.id,
                                (selection.quantities[p.id] || 1) - 1,
                              )
                            }
                          >
                            <Minus size={15} />
                          </button>
                          <output aria-label={`${p.name} quantity`}>
                            {selection.quantities[p.id] || 1}
                          </output>
                          <button
                            className="icon-button"
                            aria-label={`Increase ${p.name} quantity`}
                            disabled={
                              (selection.quantities[p.id] || 1) >=
                              MAX_ENQUIRY_QUANTITY
                            }
                            onClick={() =>
                              selection.setQuantity(
                                p.id,
                                (selection.quantities[p.id] || 1) + 1,
                              )
                            }
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => {
                          selection.toggle(p.id);
                          setStatus("");
                        }}
                        aria-label={`Remove ${p.name} — ${c.name} from enquiry list`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </section>
              ) : null;
            })}
          </div>
          <div className="basket-summary">
            <div className="enquiry-subtotal">
              <span>Products subtotal</span>
              <strong>{money(subtotal)}</strong>
              <small>
                Confirm jar size, stock and delivery details before ordering.
              </small>
            </div>
            <div className="cart-total-row">
              <span>Delivery</span>
              <strong>{money(delivery)}</strong>
            </div>
            <div className="cart-total-row cart-grand-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <a
              className="cart-account-link"
              href="/account"
              onClick={onNavigate}
            >
              Sign in / Manage account ↗
            </a>
            <span className="basket-action-label">SEND YOUR ENQUIRY</span>
            <div className="basket-contact-actions">
              {dm && !unavailable && (
                <a
                  className="basket-contact whatsapp-contact"
                  href={dm}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={19} /> WhatsApp{" "}
                  <ArrowUpRight size={16} />
                </a>
              )}
              {!unavailable && (
                <EmailEnquiry message={message} label="Email" prominent />
              )}
            </div>
            <p className="basket-reassurance">
              Opens an editable message. Review and send it yourself.
              <br />
              No payment is taken or order placed here.
            </p>
          </div>
          <details className="basket-draft-details">
            <summary>Preview or copy your enquiry</summary>
            <label className="enquiry-message">
              Your enquiry draft
              <textarea readOnly value={message} rows={7} />
            </label>
            <button
              className="button primary"
              disabled={copying}
              onClick={async () => {
                if (copyingRef.current) return;
                copyingRef.current = true;
                setCopying(true);
                setStatus("");
                try {
                  if (!navigator.clipboard?.writeText)
                    throw Error("unavailable");
                  await navigator.clipboard.writeText(message);
                  setStatus(
                    "Enquiry draft copied. Nothing has been sent; open WhatsApp or email to send it.",
                  );
                } catch {
                  setStatus(
                    "Copy is unavailable. Select and copy the draft above manually. Nothing has been sent.",
                  );
                } finally {
                  copyingRef.current = false;
                  setCopying(false);
                }
              }}
            >
              <Copy size={16} />
              {copying ? "Copying…" : "Copy enquiry draft"}
            </button>
            <EmailEnquiry message={message} label="Open Gmail" fallback />
          </details>
          <p role="status" aria-live="polite">
            {status}
          </p>
        </>
      )}
    </div>
  );
}
