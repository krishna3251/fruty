import { useRef, useState } from "react";
import { useSession } from "../context/Session";
import {
  Plus,
  Pencil,
  LockKeyhole,
  Upload,
  Check,
  ShoppingBag,
} from "lucide-react";
import type { PickleProduct } from "../data/pickles";
import { useCatalogue } from "../context/Catalogue";
import { money } from "../data/products";
import OwnerOperations from "./OwnerOperations";
import { validateProduct } from "../lib/catalogue";
const blank: PickleProduct = {
  id: "",
  name: "",
  description: "",
  image: "",
  imageAlt: "",
  price: null,
  jarSize: null,
  ingredients: null,
  flavourDescriptors: [],
  availability: "unconfirmed",
  currency: "INR",
  collectionId: "tropical-feast",
  imageType: "owner-supplied",
  serviceArea: "Hyderabad only",
  orderMethod: "direct-message",
};
export function ProductManager({
  getToken,
}: {
  getToken: () => Promise<string | null>;
}) {
  const { refresh } = useCatalogue();
  const password = useRef("");
  const [entered, setEntered] = useState("");
  const [catalogue, setCatalogue] = useState<{
    products: PickleProduct[];
    revision: string;
  } | null>(null);
  const [draft, setDraft] = useState<PickleProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  async function send(body: unknown, photo?: Blob) {
    const token = await getToken();
    if (!token) throw Error("Your session expired. Sign in again.");
    const response = await fetch(
      photo ? "/api/product-image" : "/api/catalogue",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Panel-Password": password.current,
          "Content-Type": photo ? photo.type : "application/json",
        },
        body: photo || JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw Error(
        data?.error ||
          "Connection interrupted. Reload to check whether your changes saved before trying again.",
      );
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw Error(
        "The service returned an unexpected response. Reload to check your changes before trying again.",
      );
    return data;
  }
  const run = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  function edit(p: PickleProduct, isNew = false) {
    setDraft({ ...p });
    setCreating(isNew);
    setFile(null);
    setError("");
    setSuccess("");
    setPreview("");
  }
  if (!catalogue)
    return (
      <form
        className="admin-unlock"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            password.current = entered;
            const data = await send({ action: "unlock" });
            setCatalogue(data);
            setEntered("");
          });
        }}
      >
        <LockKeyhole size={30} />
        <h2>Owner access</h2>
        <p>
          Sign in with your verified owner email, then enter your private panel
          password. Customer accounts cannot open this workspace.
        </p>
        <label>
          Panel password
          <input
            type="password"
            autoComplete="off"
            required
            maxLength={200}
            value={entered}
            onChange={(e) => setEntered(e.target.value)}
          />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="button primary" disabled={busy}>
          {busy ? "Checking access…" : "Unlock product panel"}
        </button>
      </form>
    );
  return (
    <div className="admin-workspace">
      <header className="admin-heading">
        <div>
          <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
          <h2>The pantry manager.</h2>
          <p>
            Add a jar, update its price, or mark it unavailable. Changes appear
            in the live shop after saving.
          </p>
        </div>
        <button
          className="text-link"
          onClick={() => {
            password.current = "";
            setCatalogue(null);
            setDraft(null);
            setError("");
            setSuccess("");
          }}
        >
          Lock panel <LockKeyhole size={15} />
        </button>
      </header>
      <div className="admin-stats">
        <span>
          <strong>{catalogue.products.length}</strong> Products
        </span>
        <span>
          <strong>₹150 standard</strong> Delivery per order; area rules may
          override
        </span>
        <span>
          <ShoppingBag size={20} /> Enquiry-based store
        </span>
      </div>
      <div role="alert" className="form-error">
        {error}
      </div>
      <p role="status" className="admin-success">
        {success}
      </p>
      <OwnerOperations getToken={getToken} password={() => password.current} />
      <div className="admin-layout">
        <section className="admin-product-list">
          <div className="admin-list-heading">
            <h3>Your products</h3>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => edit(blank, true)}
            >
              <Plus size={16} />
              Add product
            </button>
          </div>
          {catalogue.products.map((p) => (
            <button
              className={`admin-product-row ${draft?.id === p.id ? "active" : ""}`}
              key={p.id}
              disabled={busy}
              onClick={() => edit(p)}
            >
              <img src={p.image} alt="" width={76} height={76} />
              <span>
                <strong>{p.name}</strong>
                <small>
                  {money(p.price || 0)} · {p.availability}
                </small>
              </span>
              <Pencil size={17} />
            </button>
          ))}
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setCatalogue(await send({ action: "unlock" }));
                setDraft(null);
                setSuccess("Catalogue reloaded.");
              })
            }
          >
            Reload latest catalogue
          </button>
        </section>
        {draft ? (
          <form
            className="admin-editor"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                let product = { ...draft };
                if (file) {
                  const uploaded = await send(null, file);
                  product.image = uploaded.image;
                  setDraft(product);
                  setFile(null);
                }
                product = validateProduct(product);
                const result = await send({
                  action: creating ? "create" : "update",
                  product,
                  revision: catalogue.revision,
                });
                setCatalogue(result);
                setDraft(null);
                refresh();
                setSuccess(`${product.name} saved to the live catalogue.`);
              });
            }}
          >
            <div className="admin-list-heading">
              <h3>{creating ? "Add a new product" : "Edit product"}</h3>
              <button
                className="text-link"
                type="button"
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                Cancel
              </button>
            </div>
            <fieldset disabled={busy}>
              <label>
                Product name
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft({
                      ...draft,
                      name,
                      ...(creating
                        ? {
                            id: name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          }
                        : {}),
                    });
                  }}
                />
              </label>
              <label>
                Product URL slug
                <input
                  required
                  disabled={!creating || busy}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  minLength={3}
                  maxLength={80}
                  value={draft.id}
                  onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                />
              </label>
              <div className="admin-field-pair">
                <label>
                  Price (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="100000"
                    step="0.01"
                    value={draft.price ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        price:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Jar size — optional
                  <input
                    maxLength={80}
                    value={draft.jarSize || ""}
                    placeholder="Only enter a verified size"
                    onChange={(e) =>
                      setDraft({ ...draft, jarSize: e.target.value || null })
                    }
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  required
                  minLength={10}
                  maxLength={1200}
                  rows={4}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <label>
                Product photo <span>JPEG, PNG or WebP · up to 2 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const selected = e.target.files?.[0];
                    if (!selected) return;
                    if (selected.size > 2 * 1024 * 1024) {
                      setError("Choose an image under 2 MB.");
                      e.target.value = "";
                      return;
                    }
                    setFile(selected);
                    const reader = new FileReader();
                    reader.onload = () => setPreview(reader.result as string);
                    reader.readAsDataURL(selected);
                  }}
                />
              </label>
              {(preview || draft.image) && (
                <img
                  className="admin-photo-preview"
                  src={preview || draft.image}
                  alt="Selected product preview"
                  width={240}
                  height={180}
                />
              )}
              <label>
                Photo description
                <input
                  required
                  minLength={5}
                  maxLength={240}
                  value={draft.imageAlt}
                  onChange={(e) =>
                    setDraft({ ...draft, imageAlt: e.target.value })
                  }
                />
              </label>
              <label>
                Availability
                <select
                  value={draft.availability}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      availability: e.target
                        .value as PickleProduct["availability"],
                    })
                  }
                >
                  <option value="unconfirmed">Confirm by enquiry</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Currently unavailable</option>
                </select>
              </label>
              <label>
                Verified stock quantity — leave blank when unknown
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  value={draft.stockQuantity ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      stockQuantity:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <details>
                <summary>Optional verified product details</summary>
                <label>
                  Ingredients & allergens — comma separated
                  <textarea
                    value={draft.ingredients?.join(", ") || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ingredients: e.target.value
                          ? e.target.value.split(",").map((v) => v.trim())
                          : null,
                      })
                    }
                  />
                </label>
                <label>
                  Flavour descriptors — comma separated
                  <input
                    value={draft.flavourDescriptors.join(", ")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        flavourDescriptors: e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              </details>
              <p className="admin-hint">
                Tropical Feast · INR · Hyderabad only. Leave unverified details
                blank. No payment or order is created by publishing a product.
              </p>
              <button className="button primary" disabled={busy}>
                {busy ? (
                  <>
                    <Upload size={16} />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {creating ? "Publish product" : "Save changes"}
                  </>
                )}
              </button>
            </fieldset>
          </form>
        ) : (
          <div className="admin-editor admin-editor-empty">
            <Pencil size={30} />
            <h3>A well-kept pantry.</h3>
            <p>
              Choose a product to edit, or add a new jar. All customer prices
              come from this catalogue.
            </p>
            <a href="/shop" className="text-link">
              View the shop ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { getToken, userId } = useSession();
  return <ProductManager key={userId || "guest"} getToken={getToken} />;
}
