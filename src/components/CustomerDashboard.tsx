import { useCallback, useEffect, useState } from "react";
import { ClipboardList, MapPin, Plus } from "lucide-react";
import { useNotify } from "../context/Notifications";
import { useSession } from "../context/Session";
import { usePickleSelection } from "../context/PickleSelection";
import { customerApi } from "../lib/customerApi";
import {
  emptyAddress,
  validateAddress,
  type Address,
  type StoreOrder,
} from "../lib/customer";
import AddressFields from "./AddressFields";
import { money } from "../data/products";

export type CustomerSection = "enquiries" | "addresses" | "privacy";

export default function CustomerDashboard({
  section,
}: {
  section: CustomerSection;
}) {
  const session = useSession();
  const selection = usePickleSelection();
  const [data, setData] = useState<{
    addresses: Address[];
    orders: StoreOrder[];
  } | null>(null);
  const [address, setAddress] = useState<Address>({ ...emptyAddress });
  const [editingAddress, setEditingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useNotify();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await customerApi(
          "/api/customer",
          { action: "load" },
          session.getToken,
        ),
      );
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session.userId, session.getToken]);
  useEffect(() => {
    void load();
  }, [load]);
  async function action(body: unknown) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await customerApi("/api/customer", body, session.getToken);
      const refreshed = await load();
      setStatus(
        refreshed
          ? "Your change was saved."
          : "Saved, but your account could not be refreshed. Please try again.",
      );
      if (refreshed) notify("Your change was saved.", "success");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="customer-dashboard">
      {selection?.syncStatus && <p role="status">{selection.syncStatus}</p>}
      <p className="form-error" role="alert">
        {error}
      </p>
      <p role="status">{status}</p>
      {section === "privacy" ? (
        <div className="account-section">
          <span className="account-kicker">YOUR DATA</span>
          <h3>Privacy & store data</h3>
          <p>You're in control of the information saved with your account.</p>
          <details className="delete-account-data">
            <summary>Delete my store data</summary>
            <p>
              Deletes your saved addresses, account cart and linked store
              enquiries. This does not delete your Clerk sign-in account or
              messages already sent on WhatsApp/email. Manage your Clerk account
              in profile and security. This action cannot be undone.
            </p>
            <label>
              Type DELETE MY STORE DATA
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              className="button secondary"
              disabled={busy || confirmation !== "DELETE MY STORE DATA"}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setError("");
                try {
                  await customerApi(
                    "/api/customer",
                    { action: "delete-data", confirm: confirmation },
                    session.getToken,
                  );
                  setConfirmation("");
                  setData({ addresses: [], orders: [] });
                  setAddress({ ...emptyAddress });
                  setEditingAddress(false);
                  window.dispatchEvent(new Event("pantry:store-data-deleted"));
                  setStatus(
                    "Store data deleted. Your sign-in account remains with Clerk.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete store data
            </button>
          </details>
          <a href="/privacy" className="text-link">
            Read our privacy & storage policy ↗
          </a>
        </div>
      ) : loading && !data ? (
        <p className="account-loading" role="status">
          Loading your account…
        </p>
      ) : !data ? (
        <button className="text-link" onClick={() => void load()}>
          Retry loading your account
        </button>
      ) : section === "enquiries" ? (
        <div className="account-section">
          <span className="account-kicker">YOUR ORDERS</span>
          <h3>Your enquiries</h3>
          <p>Keep track of enquiries you prepared with delivery details.</p>
          {!data.orders.length ? (
            <div className="account-empty-state">
              <span className="account-empty-icon">
                <ClipboardList size={22} />
              </span>
              <div>
                <strong>No enquiries here yet</strong>
                <p>
                  When you prepare an enquiry with delivery details, it will
                  appear here. Direct WhatsApp or email drafts aren't saved to
                  your account.
                </p>
                <a href="/shop" className="text-link">
                  Explore the pickles ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="account-order-list">
              {data.orders.map((o) => (
                <article className="customer-order" key={o.reference}>
                  <div className="account-order-heading">
                    <strong>{o.reference}</strong>
                    <span>{o.status.replaceAll("_", " ")}</span>
                  </div>
                  <p>
                    {o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                  </p>
                  <p>
                    Products {money(Number(o.subtotal))} ·{" "}
                    {o.total === null
                      ? "Delivery and final amount to be confirmed"
                      : `${["confirmed", "preparing", "dispatched", "delivered"].includes(o.status) ? "Confirmed" : "Estimated"} total ${money(Number(o.total))}`}{" "}
                    · Payment: {o.payment_status}
                  </p>
                </article>
              ))}
              <p className="account-footnote">
                The business confirms every order. Opening a WhatsApp draft
                alone does not place an order.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="account-section">
          <div className="account-section-heading">
            <div>
              <span className="account-kicker">FOR NEXT TIME</span>
              <h3>Saved addresses</h3>
              <p>
                Save a delivery address for quicker enquiries. This is optional.
              </p>
            </div>
            {!editingAddress && (
              <button
                className="account-add-address"
                onClick={() => {
                  setAddress({ ...emptyAddress });
                  setEditingAddress(true);
                }}
              >
                <Plus size={16} /> Add address
              </button>
            )}
          </div>
          {!data.addresses.length && !editingAddress ? (
            <div className="account-empty-state">
              <span className="account-empty-icon">
                <MapPin size={22} />
              </span>
              <div>
                <strong>No saved addresses</strong>
                <p>
                  Add one whenever you're ready, or continue shopping without
                  one.
                </p>
              </div>
            </div>
          ) : (
            <div className="saved-addresses">
              {data.addresses.map((a) => (
                <article key={a.id}>
                  <strong>
                    {a.label}
                    {a.isDefault ? " · Default" : ""}
                  </strong>
                  <p>
                    {a.recipient}
                    <br />
                    {a.street}, {a.locality}
                    <br />
                    {a.city} {a.pin}
                  </p>
                  <div className="saved-address-actions">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => {
                        setAddress({ ...a });
                        setEditingAddress(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void action({ action: "delete-address", id: a.id })
                      }
                    >
                      Delete address
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {editingAddress && (
            <form
              className="account-address-form"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const validated = validateAddress(address);
                  void action({
                    action: "save-address",
                    address: validated,
                  }).then((ok) => {
                    if (ok) {
                      setAddress({ ...emptyAddress });
                      setEditingAddress(false);
                    }
                  });
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <h4>
                {address.id
                  ? "Edit delivery address"
                  : "Add a delivery address"}
              </h4>
              <fieldset disabled={busy}>
                <AddressFields
                  value={address}
                  onChange={setAddress}
                  saveLabel
                />
                <div className="account-form-actions">
                  <button className="button primary">
                    {busy ? "Saving…" : "Save address"}
                  </button>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => {
                      setAddress({ ...emptyAddress });
                      setEditingAddress(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
