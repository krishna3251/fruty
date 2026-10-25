import { useState } from "react";
import { customerApi } from "../lib/customerApi";
import {
  orderStatuses,
  type OrderStatus,
  type StoreOrder,
} from "../lib/customer";
import { businessDefaults, type BusinessSettings } from "../lib/business";
import { money } from "../data/products";
export default function OwnerOperations({
  getToken,
  password,
}: {
  getToken: () => Promise<string | null>;
  password: () => string;
}) {
  const [tab, setTab] = useState<"orders" | "settings">("orders");
  const [orders, setOrders] = useState<StoreOrder[] | null>(null);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<BusinessSettings>({
    ...businessDefaults,
  });
  const [version, setVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<
    (Omit<StoreOrder, "delivery"> & { delivery: string | number }) | null
  >(null);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const send = (path: string, body: unknown) =>
    customerApi(path, body, getToken, password());
  async function loadOrders() {
    const d = await send("/api/owner-orders", {
      action: "list",
      status: filter,
      search,
    });
    setOrders(d.orders);
    setEdit(null);
  }
  return (
    <section className="owner-operations">
      <h3>Enquiries & business settings</h3>
      <p>
        Private customer information. Only a real business confirmation should
        change an enquiry into an order.
      </p>
      <div className="filters">
        <button
          className={tab === "orders" ? "active" : ""}
          aria-pressed={tab === "orders"}
          onClick={() => setTab("orders")}
        >
          Enquiries
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          aria-pressed={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          Business settings
        </button>
      </div>
      <p role="alert" className="form-error">
        {error}
      </p>
      <p role="status">{status}</p>
      {tab === "orders" ? (
        <>
          <form
            className="owner-order-filter"
            onSubmit={(e) => {
              e.preventDefault();
              void run(loadOrders);
            }}
          >
            <label>
              Reference
              <input
                value={search}
                maxLength={40}
                placeholder="TF-…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {orderStatuses.map((s) => (
                  <option value={s} key={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? "Loading…" : "Load enquiries"}
            </button>
          </form>
          <p>
            Most recent 100 matching enquiries. Search by reference for older
            records.
          </p>
          {orders?.length === 0 && <p>No matching enquiries.</p>}
          {orders?.map((o) => (
            <article className="owner-order" key={o.id}>
              <button
                className="text-link"
                onClick={() =>
                  setEdit({
                    ...o,
                    delivery: o.delivery === null ? "" : o.delivery,
                  })
                }
              >
                {o.reference} · {o.status.replaceAll("_", " ")} ↗
              </button>
              <span>
                {o.customer.recipient} · {o.customer.locality} ·{" "}
                {o.customer.pin}
              </span>
              <p>
                {o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")} ·
                Products {money(Number(o.subtotal))}
              </p>
            </article>
          ))}
          {edit && (
            <form
              className="owner-order-editor"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const d = await send("/api/owner-orders", {
                    action: "update",
                    id: edit.id,
                    version: edit.version,
                    status: edit.status,
                    delivery:
                      edit.delivery === "" ? null : Number(edit.delivery),
                    paymentMethod: edit.payment_method,
                    paymentStatus: edit.payment_status,
                  });
                  setOrders(
                    (orders || []).map((o) =>
                      o.id === d.order.id ? d.order : o,
                    ),
                  );
                  setEdit(null);
                  setStatus(
                    "Enquiry updated after the server confirmed saving.",
                  );
                });
              }}
            >
              <h4>{edit.reference}</h4>
              <p>
                {edit.customer.recipient} · {edit.customer.phone}
                <br />
                {edit.customer.street}, {edit.customer.locality},{" "}
                {edit.customer.city} {edit.customer.pin}
              </p>
              <a
                className="text-link"
                href={`https://wa.me/${edit.customer.phone.startsWith("91") ? edit.customer.phone : "91" + edit.customer.phone}?text=${encodeURIComponent(`Hello, regarding your Tropical Feast enquiry ${edit.reference}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open customer WhatsApp ↗
              </a>
              <fieldset disabled={busy}>
                <label>
                  Order status
                  <select
                    value={edit.status}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        status: e.target.value as OrderStatus,
                      })
                    }
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Confirmed delivery charge (₹) — blank until confirmed
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={edit.delivery}
                    onChange={(e) =>
                      setEdit({ ...edit, delivery: e.target.value })
                    }
                  />
                </label>
                <label>
                  Agreed payment method
                  <input
                    maxLength={80}
                    minLength={2}
                    required
                    value={edit.payment_method}
                    onChange={(e) =>
                      setEdit({ ...edit, payment_method: e.target.value })
                    }
                  />
                </label>
                <label>
                  Payment status
                  <select
                    value={edit.payment_status}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        payment_status: e.target
                          .value as StoreOrder["payment_status"],
                      })
                    }
                  >
                    {["unpaid", "paid", "refunded"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <p>
                  Recording payment here does not process or verify a payment.
                  Confirm it outside the website first.
                </p>
                <button className="button primary">
                  {busy ? "Saving…" : "Save business confirmation"}
                </button>
              </fieldset>
              <details>
                <summary>Status history</summary>
                {edit.history.map((h, i: number) => (
                  <p key={i}>
                    {h.at} · {h.status.replaceAll("_", " ")}
                    {h.delivery != null ? ` · delivery ₹${h.delivery}` : ""}
                  </p>
                ))}
              </details>
            </form>
          )}
        </>
      ) : (
        <>
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const d = await send("/api/business", { action: "load" });
                setSettings(d.settings);
                setVersion(d.version);
              })
            }
          >
            Load current settings
          </button>
          {version !== null && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const d = await send("/api/business", {
                    action: "save",
                    settings,
                    version,
                  });
                  setSettings(d.settings);
                  setVersion(d.version);
                  setStatus(
                    "Business settings saved. Refresh the shop to see updates.",
                  );
                });
              }}
            >
              <fieldset disabled={busy}>
                {(
                  [
                    ["name", "Business name"],
                    ["email", "Contact email"],
                    ["whatsapp", "Verified WhatsApp number with country code"],
                    ["instagram", "Instagram profile URL"],
                    ["tagline", "Tagline"],
                    ["hours", "Business hours"],
                    [
                      "deliveryEstimate",
                      "Verified delivery estimate — optional",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={settings[key]}
                      required={key !== "deliveryEstimate"}
                      maxLength={200}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label>
                  Free delivery threshold (₹) — blank to disable
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={settings.freeDeliveryThreshold ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeDeliveryThreshold:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <h4>Verified Hyderabad service areas</h4>
                <p>
                  No matching PIN means coverage and delivery charge require
                  manual confirmation. Rates are estimates until the business
                  confirms the enquiry.
                </p>
                {settings.areas.map((a, i) => (
                  <div className="delivery-rule" key={i}>
                    <label>
                      Area name
                      <input
                        required
                        value={a.name}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            areas: settings.areas.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      PIN codes — comma separated
                      <input
                        required
                        value={a.pins.join(",")}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            areas: settings.areas.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    pins: e.target.value
                                      .split(",")
                                      .map((s) => s.trim()),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Estimated delivery ₹ — blank for manual
                      <input
                        type="number"
                        min="0"
                        max="100000"
                        step="0.01"
                        value={a.rate ?? ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            areas: settings.areas.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    rate:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      className="text-link"
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          areas: settings.areas.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove area
                    </button>
                  </div>
                ))}
                <button
                  className="text-link"
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      areas: [
                        ...settings.areas,
                        { name: "", pins: [], rate: null },
                      ],
                    })
                  }
                >
                  + Add confirmed service area
                </button>
                <button className="button primary">
                  {busy ? "Saving…" : "Save business settings"}
                </button>
              </fieldset>
            </form>
          )}
        </>
      )}
    </section>
  );
}
