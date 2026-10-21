import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Leaf,
  Minus,
  Plus,
  PackageCheck,
  Truck,
} from "lucide-react";
import { asset, money, products, type Product } from "../data/products";
import { FruitImage } from "./Resilience";
import { navigate } from "../hooks/useRoute";
export default function ProductPage({
  product: p,
  saved,
  onSave,
  onAdd,
}: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onAdd: (p: Product, quantity?: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("The good stuff");
  useEffect(() => {
    setQuantity(1);
    setTab("The good stuff");
    document.title = `${p.name} · furity`;
  }, [p.id]);
  return (
    <div className="product-page section-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          Home
        </a>
        <span>/</span>
        <a
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            navigate("/shop");
          }}
        >
          Shop
        </a>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="pdp-grid">
        <div className="pdp-visual" style={{ background: p.color }}>
          <span className="eyebrow">{p.label}</span>
          <span className="pdp-word" aria-hidden="true">
            {p.image === "orange" ? "citrus" : p.image}
          </span>
          <FruitImage
            src={asset(p.image)}
            alt={p.name}
            width="700"
            height="600"
          />
          <button
            className={`wishlist-heart ${saved ? "is-saved" : ""}`}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved fruit" : "Save this fruit"}
            onClick={onSave}
          >
            <Heart size={21} fill={saved ? "currentColor" : "none"} />
          </button>
          <span className="pdp-seal">
            GOOD FRUIT.
            <br />
            GOOD MOOD. ✳
          </span>
        </div>
        <div className="pdp-details">
          <span className="eyebrow">
            {p.category.toUpperCase()} / A FRESH LITTLE JOY
          </span>
          <h1>{p.name}</h1>
          <p className="pdp-subtitle">{p.subtitle}</p>
          <p className="pdp-description">{p.description}</p>
          <div className="pdp-price">
            <strong>{money(p.price)}</strong>
            <span>{p.weight}</span>
          </div>
          <p className={`availability ${p.available ? "" : "unavailable"}`}>
            <i />
            {p.available
              ? "Available in the sample collection"
              : "Out of season · currently unavailable"}
          </p>
          <div className="pdp-add">
            <div className="quantity">
              <button
                aria-label="Decrease selected packs"
                disabled={quantity === 1}
                onClick={() => setQuantity((n) => n - 1)}
              >
                <Minus size={17} />
              </button>
              <output aria-label="Selected packs">{quantity}</output>
              <button
                aria-label="Increase selected packs"
                disabled={quantity === 20}
                onClick={() => setQuantity((n) => n + 1)}
              >
                <Plus size={17} />
              </button>
            </div>
            <button
              className="button primary"
              disabled={!p.available}
              onClick={() => onAdd(p, quantity)}
            >
              {p.available ? "Add to your bag" : "Back another season"}
              <Plus size={18} />
            </button>
          </div>
          <div className="pdp-benefits">
            <span>
              <Leaf size={17} /> Origin: {p.origin}
            </span>
            <span>
              <PackageCheck size={17} /> Thoughtfully selected
            </span>
            <span>
              <Truck size={17} /> Sample delivery estimate at checkout
            </span>
          </div>
          <small className="demo-disclaimer">
            Sample catalogue. Live stock, payment and delivery services are not
            connected.
          </small>
          <div
            className="product-tabs"
            role="tablist"
            aria-label="Product information"
          >
            {["The good stuff", "Keep it fresh", "Delivery"].map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t.replaceAll(" ", "-")}`}
                aria-selected={tab === t}
                aria-controls="product-tabpanel"
                tabIndex={tab === t ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const tabs = [
                      "The good stuff",
                      "Keep it fresh",
                      "Delivery",
                    ];
                    const next =
                      tabs[
                        (tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                      ];
                    setTab(next);
                    document
                      .getElementById(`tab-${next.replaceAll(" ", "-")}`)
                      ?.focus();
                  }
                }}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            id="product-tabpanel"
            role="tabpanel"
            aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}
            className="product-tab-panel"
          >
            {tab === "The good stuff"
              ? p.description
              : tab === "Keep it fresh"
                ? p.storage
                : "Delivery estimates are illustrative: ₹49 below a ₹799 bag, free at ₹799 or above. This demo does not check serviceability or fulfill orders."}
          </div>
        </div>
      </div>
      <div className="related-heading">
        <h2>A little more goodness.</h2>
        <a
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            navigate("/shop");
          }}
          className="text-link"
        >
          Explore the harvest <ArrowUpRight size={17} />
        </a>
      </div>
      <div className="related-grid">
        {products
          .filter((other) => other.id !== p.id)
          .slice(0, 3)
          .map((other) => (
            <a
              key={other.id}
              href={`/products/${other.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/products/${other.id}`);
              }}
            >
              <div style={{ background: other.color }}>
                <FruitImage
                  src={asset(other.image)}
                  alt={other.name}
                  width="300"
                  height="240"
                  loading="lazy"
                />
              </div>
              <span>
                {other.name}
                <b>{money(other.price)}</b>
              </span>
            </a>
          ))}
      </div>
      <a
        className="text-link"
        href="/shop"
        onClick={(e) => {
          e.preventDefault();
          navigate("/shop");
        }}
      >
        <ArrowLeft size={16} /> Back to the market
      </a>
    </div>
  );
}
