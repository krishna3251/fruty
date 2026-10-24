import { useRef, useState } from "react";
import { ArrowUpRight, Copy, Trash2 } from "lucide-react";
import {
  collectionFor,
  pickleCollections,
  pickleProducts,
} from "../data/pickles";
import { usePickleSelection } from "../context/PickleSelection";
import { enquiryEmail, enquiryWhatsApp } from "../lib/contact";
import { money } from "../data/products";
export default function EnquiryList() {
  const selection = usePickleSelection();
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const copyingRef = useRef(false);
  if (!selection) return null;
  const selected = pickleProducts.filter((p) => selection.ids.includes(p.id));
  const message = [
    "Hello, I’d like to enquire about:",
    ...selected.map(
      (p) => `• ${p.name} — ${collectionFor(p).name} — ${money(p.price!)}`,
    ),
    "Please confirm jar sizes, ingredients/allergens, stock, delivery charges and the final total before I order.",
  ].join("\n");
  const dm = enquiryWhatsApp(message);
  const email = enquiryEmail(message);
  return (
    <div className="enquiry-list">
      <p>
        Your list is saved on this device. It is not a cart, order or
        reservation; no payment is taken.
      </p>
      {selection.storageUnavailable && (
        <p role="status">
          Browser storage is unavailable. Your list lasts for this visit only.
        </p>
      )}
      {!selected.length ? (
        <div className="enquiry-empty">
          <span aria-hidden="true">✳</span>
          <h3>A little tang is waiting.</h3>
          <p>
            Save the pickles you want to ask about, then review each
            collection’s enquiry details.
          </p>
          <a href="/shop" className="button primary">
            Explore pickles <ArrowUpRight size={17} />
          </a>
        </div>
      ) : (
        <>
          {pickleCollections.map((c) => {
            const items = selected.filter((p) => p.collectionId === c.id);
            return items.length ? (
              <section key={c.id} className="enquiry-group">
                <h3>{c.name}</h3>
                {items.map((p) => (
                  <div className="enquiry-item" key={p.id}>
                    <div>
                      <a href={`/products/${p.id}`}>{p.name}</a>
                      <small>{money(p.price!)} · Confirm jar size</small>
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
                <p>
                  {c.serviceArea
                    ? `${c.serviceArea}. `
                    : "Service area unconfirmed. "}
                  {c.orderMethod
                    ? "Direct-message enquiries."
                    : "Supplier ordering channel not yet supplied."}
                </p>
                {c.id === "tropical-feast" && dm ? (
                  <a
                    className="text-link"
                    href={dm}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enquire on WhatsApp <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <a
                    className="text-link"
                    href={
                      c.id === "tropical-feast"
                        ? "/collections/tropical-feast#tropical-ordering"
                        : "/ordering"
                    }
                  >
                    View enquiry status <ArrowUpRight size={16} />
                  </a>
                )}
              </section>
            ) : null;
          })}
          {email && (
            <a className="text-link" href={email}>
              Enquire by email <ArrowUpRight size={16} />
            </a>
          )}
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
                if (!navigator.clipboard?.writeText) throw Error("unavailable");
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
          <p role="status" aria-live="polite">
            {status}
          </p>
        </>
      )}
    </div>
  );
}
