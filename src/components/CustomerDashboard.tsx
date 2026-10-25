import { useNotify } from "../context/Notifications";
import { useCallback, useEffect, useState } from "react";
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
export default function CustomerDashboard() {
  const { userId } = useSession();
  return <CustomerDashboardContents key={userId || "guest"} />;
}
function CustomerDashboardContents() {
  const session = useSession();
  const selection = usePickleSelection();
  const [data, setData] = useState<{
    addresses: Address[];
    orders: StoreOrder[];
  } | null>(null);
  const [address, setAddress] = useState<Address>({ ...emptyAddress });
  const [error, setError] = useState("");
  const notify = useNotify();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const load = useCallback(async () => {
    try {
      setData(
        await customerApi(
          "/api/customer",
          { action: "load" },
          session.getToken,
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [session.userId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function action(body: unknown) {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await customerApi("/api/customer", body, session.getToken);
      await load();
      setStatus("Your change was saved.");
      notify("Your change was saved.", "success");
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
      <span className="eyebrow">YOUR TROPICAL FEAST ACCOUNT</span>
      <h2>Your little pantry.</h2>
      <p>
        Saved addresses and enquiry status. Final order confirmation comes from
        the business.
      </p>
      <p role="status">{selection?.syncStatus}</p>
      <p className="form-error" role="alert">
        {error}
      </p>
      <p role="status">{status}</p>
      {!data ? (
        <button className="text-link" onClick={() => void load()}>
          Retry loading your account
        </button>
      ) : (
        <>
          <h3>Saved addresses</h3>
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
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => setAddress({ ...a })}
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
              </article>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const validated = validateAddress(address);
                void action({
                  action: "save-address",
                  address: validated,
                }).then((ok) => {
                  if (ok) setAddress({ ...emptyAddress });
                });
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <h3>
              {address.id ? "Edit delivery address" : "Add a delivery address"}
            </h3>
            <fieldset disabled={busy}>
              <AddressFields value={address} onChange={setAddress} saveLabel />
              <button className="button primary">
                {busy ? "Saving…" : "Save address"}
              </button>
              {address.id && (
                <button
                  className="text-link"
                  type="button"
                  onClick={() => setAddress({ ...emptyAddress })}
                >
                  Cancel edit
                </button>
              )}
            </fieldset>
          </form>
          <h3>Your enquiries</h3>
          {!data.orders.length ? (
            <p>
              No submitted enquiries yet. Opening a WhatsApp draft does not
              confirm an order.
            </p>
          ) : (
            data.orders.map((o) => (
              <article className="customer-order" key={o.reference}>
                <strong>{o.reference}</strong>
                <span>{o.status.replaceAll("_", " ")}</span>
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
            ))
          )}
          <details className="delete-account-data">
            <summary>Delete my store data</summary>
            <p>
              Deletes your saved addresses, account cart and linked store
              enquiries. This does not delete your sign-in account or messages
              already sent on WhatsApp/email. Manage your sign-in account in
              security controls below. This action cannot be undone.
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
                  window.dispatchEvent(new Event("pantry:store-data-deleted"));
                  setStatus(
                    "Store data deleted. Your sign-in account remains with your authentication provider.",
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
        </>
      )}
    </section>
  );
}
