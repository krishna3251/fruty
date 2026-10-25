import ProductGallery from "./ProductGallery";
import JarLab from "./JarLab";
import ShoppingConfidence from "./ShoppingConfidence";
import { useCatalogue } from "../context/Catalogue";
import { useBusiness } from "../context/Business";
import { DELIVERY_NOTICE } from "../lib/business";
import { useRef, useState, type PointerEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Search,
  Leaf,
  ShoppingBag,
  Check,
} from "lucide-react";
import {
  pickleCollections,
  brandAssets,
  collectionFor,
  type PickleProduct,
  type PickleCollection,
} from "../data/pickles";
import { money } from "../data/products";
import { enquiryGmail, enquiryWhatsApp } from "../lib/contact";
import { FruitImage } from "./Resilience";
import { usePickleSelection } from "../context/PickleSelection";
export function PickleHero() {
  return (
    <section className="pickle-hero" aria-labelledby="pickle-hero-title">
      <div className="pickle-hero-copy">
        <span className="eyebrow">
          <Leaf size={15} /> TROPICAL FEAST / THE PICKLE EDIT
        </span>
        <h1 id="pickle-hero-title">
          Two flavours.
          <br />
          <em>A feast of</em>
          <br />
          character.
        </h1>
        <p>
          Pineapple or cucumber? Discover Tropical Feast’s crisp, spicy and
          tangy pickle flavours, each with a character of its own.
        </p>
        <div className="pickle-hero-actions">
          <a className="button primary" href="/shop">
            Explore both flavours <ArrowUpRight size={18} />
          </a>
          <a className="text-link" href="/ordering">
            How to order <ArrowRight size={16} />
          </a>
        </div>
        <div className="pickle-hero-note">
          <span>Tropical Feast</span>
          <span>{pickleCollections[0].tagline}</span>
        </div>
      </div>
      <div className="pickle-hero-visual">
        <span className="pickle-art-index">PINEAPPLE / CUCUMBER</span>
        <figure className="pickle-artwork">
          <FruitImage
            src={brandAssets.hero}
            alt="Tropical Feast Pineapple Pickle and Cucumber Pickle jars together with golden lids and botanical labels"
            width="1254"
            height="1254"
            fetchPriority="high"
          />
          <figcaption>Product images supplied by the owner</figcaption>
        </figure>
      </div>
    </section>
  );
}
function SavePickle({
  product: p,
  detail = false,
}: {
  product: PickleProduct;
  detail?: boolean;
}) {
  const selection = usePickleSelection();
  if (!selection) return null;
  const saved = selection.ids.includes(p.id);
  const unavailable =
    p.availability === "unavailable" ||
    p.price === null ||
    p.stockQuantity === 0;
  return (
    <button
      className={`button primary product-add ${detail ? "pickle-save-detail" : ""}`}
      disabled={unavailable || selection.syncLoading}
      onClick={() => {
        if (saved) window.dispatchEvent(new window.Event("pantry:open-cart"));
        else selection.add(p.id);
      }}
      aria-label={`${unavailable ? "Unavailable" : saved ? "View cart for" : "Add to cart:"} ${p.name}`}
    >
      {saved ? <Check size={17} /> : <ShoppingBag size={17} />}
      {unavailable
        ? "Currently unavailable"
        : saved
          ? "Added · View cart"
          : "Add to cart"}
    </button>
  );
}

function PickleCard({ product: p }: { product: PickleProduct }) {
  const card = useRef<HTMLElement>(null);
  const tilt = (e: PointerEvent<HTMLElement>) => {
    if (
      e.pointerType !== "mouse" ||
      !window.matchMedia(
        "(hover:hover) and (pointer:fine) and (prefers-reduced-motion: no-preference)",
      ).matches ||
      card.current?.closest(".motion-paused")
    )
      return;
    const box = e.currentTarget.getBoundingClientRect();
    card.current?.style.setProperty(
      "--card-x",
      `${((e.clientX - box.left) / box.width - 0.5) * 5}deg`,
    );
    card.current?.style.setProperty(
      "--card-y",
      `${-((e.clientY - box.top) / box.height - 0.5) * 5}deg`,
    );
  };
  return (
    <article
      ref={card}
      onPointerMove={tilt}
      onPointerLeave={() => {
        card.current?.style.setProperty("--card-x", "0deg");
        card.current?.style.setProperty("--card-y", "0deg");
      }}
      className={`pickle-card pantry-product-card ${p.collectionId} ${p.id.includes("pineapple") ? "flavour-gold" : "flavour-green"}`}
    >
      <div className="product-card-topline">
        <span>Tropical Feast</span>
        <span>
          {p.availability === "unavailable"
            ? "CURRENTLY UNAVAILABLE"
            : "THE PICKLE EDIT"}
        </span>
      </div>
      <div className="pickle-card-image">
        <ProductGallery product={p} compact />
      </div>
      <div className="pickle-card-copy">
        <div className="product-card-name">
          <h3>
            <a href={`/products/${p.id}`}>{p.name}</a>
          </h3>
          <span className="product-colour-dot" aria-hidden="true" />
        </div>
        <p className="pickle-descriptors">{p.flavourDescriptors.join(" · ")}</p>
        <div className="product-card-price">
          <strong>{p.jarSize || "Size on enquiry"}</strong>
          <span>See price in your cart before enquiring</span>
        </div>
        <p className="product-delivered-price">
          Hyderabad only · delivery by location
        </p>
        <SavePickle product={p} />
        <a className="text-link" href={`/products/${p.id}`}>
          Product details <ArrowUpRight size={16} />
        </a>
      </div>
    </article>
  );
}
function PairPick() {
  const { products } = useCatalogue();
  const selection = usePickleSelection();
  const pair = ["tropical-pineapple-pickle", "tropical-cucumber-pickle"].map(
    (id) => products.find((p) => p.id === id),
  );
  if (
    !selection ||
    pair.some(
      (p) =>
        !p ||
        p.price === null ||
        p.availability === "unavailable" ||
        p.stockQuantity === 0,
    )
  )
    return null;

  return (
    <aside className="pair-pick">
      <div>
        <span className="eyebrow">CAN’T PICK A SIDE?</span>
        <h3>Two jars. One delivery.</h3>
        <p>
          One pineapple + one cucumber. Keep both sides of your plate happy.
        </p>
      </div>
      <div className="pair-pick-action">
        <strong>
          Your flavour duo
          <small>See current prices in cart · delivery confirmed in chat</small>
        </strong>
        <button
          className="button primary"
          disabled={selection.syncLoading}
          onClick={() => {
            pair.forEach((p) => selection.add(p!.id));
            window.dispatchEvent(new window.Event("pantry:open-cart"));
          }}
        >
          Add both to cart <ArrowUpRight size={17} />
        </button>
        <small>
          If a flavour is already in your cart, its quantity stays as selected.
        </small>
      </div>
    </aside>
  );
}

function FlavourFeature({
  product: p,
  index,
}: {
  product: PickleProduct;
  index: number;
}) {
  return (
    <section
      className={`pickle-feature flavour-feature ${index === 0 ? "is-pineapple" : "is-cucumber"}`}
      aria-labelledby={`${p.id}-feature-title`}
    >
      <div className="pickle-feature-copy">
        <span className="eyebrow">0{index + 1} / TROPICAL FEAST</span>
        <h2 id={`${p.id}-feature-title`}>{p.name}</h2>
        <p className="pickle-feature-headline">
          {index === 0
            ? "A golden kind of tang."
            : "A fresh-looking green favourite."}
        </p>
        <p>{p.description}</p>
        <span className="pickle-descriptors">
          {p.flavourDescriptors.join(" · ")}
        </span>
        <a className="button primary" href={`/products/${p.id}`}>
          Discover {p.name.toLowerCase()} <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="pickle-feature-jars flavour-feature-image">
        <a href={`/products/${p.id}`} aria-label={`Discover ${p.name}`}>
          <FruitImage
            src={p.image}
            alt={p.imageAlt}
            width="1200"
            height="800"
            loading="lazy"
          />
        </a>
      </div>
    </section>
  );
}
export function PickleCraft() {
  return (
    <section className="pickle-craft section-pad">
      <figure className="pickle-artwork">
        <FruitImage
          src={brandAssets.hero}
          alt="Tropical Feast’s two pickle flavours, pineapple and cucumber, in golden-lidded jars"
          width="1254"
          height="1254"
          loading="lazy"
        />
      </figure>
      <div>
        <span className="eyebrow">TWO FLAVOURS. YOUR PICK.</span>
        <h2>
          A little tang.
          <br />
          <em>A lot of character.</em>
        </h2>
        <p>{pickleCollections[0].tagline}</p>
        <p>
          Browse pineapple and cucumber, then confirm prices, jar sizes,
          ingredients and availability before ordering.
        </p>
        <a className="text-link" href="/shop">
          Explore both flavours <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
export function TropicalOrdering({
  product,
}: { product?: PickleProduct } = {}) {
  const message = product
    ? `Hello, I’d like to enquire about ${product.name} (${product.jarSize || "size to confirm"}). Please confirm the current price, ingredients/allergens, availability and delivery.`
    : undefined;
  const business = useBusiness();
  const link = enquiryWhatsApp(message, `https://wa.me/${business.whatsapp}`);
  const email = enquiryGmail(message, business.email);
  return (
    <section
      className="pickle-ordering section-pad"
      id="tropical-ordering"
      aria-labelledby="tropical-ordering-title"
    >
      <div>
        <span className="eyebrow">
          <MapPin size={16} /> TROPICAL FEAST / ORDERING
        </span>
        <h2 id="tropical-ordering-title">Available in Hyderabad.</h2>
        <p>
          Pineapple and cucumber pickle enquiries are by direct message. Confirm
          availability, price, jar size, ingredients and delivery before
          ordering. Delivery charges will be confirmed on WhatsApp.
        </p>
      </div>
      <div className="pickle-order-action">
        {email && (
          <a
            className="text-link"
            href={email}
            target="_blank"
            rel="noopener noreferrer"
          >
            Email enquiry <ArrowUpRight size={17} />
          </a>
        )}
        {link ? (
          <>
            <a
              className="button primary"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp enquiry <ArrowUpRight size={18} />
            </a>
            <p>
              Opens WhatsApp so you can confirm the details. No order is placed
              automatically.
            </p>
          </>
        ) : (
          <>
            <span className="pickle-unconfigured">
              Ordering channel awaiting confirmation
            </span>
            <p>
              No verified DM account has been supplied. Enquiries cannot
              currently be sent from this website.
            </p>
            <a className="text-link" href="/contact">
              View contact information <ArrowUpRight size={16} />
            </a>
          </>
        )}
      </div>
    </section>
  );
}
export function PickleHome({ paused = false }: { paused?: boolean }) {
  const { products: pickleProducts } = useCatalogue();
  return (
    <div className="pickle-home" id="collections">
      <section className="section-pad homepage-picks" id="pickle-grid">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR NEXT MEAL’S PLUS ONE</span>
            <h2>Pick your flavour.</h2>
          </div>
          <a className="text-link" href="/shop">
            Explore the pantry <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-grid">
          {pickleProducts.map((p) => (
            <PickleCard key={p.id} product={p} />
          ))}
        </div>
        <PairPick />
      </section>
      <JarLab paused={paused} />
      <div className="pickle-intro section-pad">
        <span className="eyebrow">A LITTLE MORE CHARACTER</span>
        <h2>
          Good food.
          <br />
          <em>Great company.</em>
        </h2>
        <p>
          Meet the original Tropical Feast pair: golden pineapple and green
          cucumber.
        </p>
      </div>
      {pickleProducts
        .filter((p) =>
          ["tropical-pineapple-pickle", "tropical-cucumber-pickle"].includes(
            p.id,
          ),
        )
        .map((p, i) => (
          <FlavourFeature key={p.id} product={p} index={i} />
        ))}
      <TropicalOrdering />
    </div>
  );
}

export function PickleCatalogue({
  collection,
  cataloguePath = "/pickles",
}: {
  collection?: PickleCollection;
  cataloguePath?: string;
}) {
  const { products: pickleProducts, loading, error, refresh } = useCatalogue();
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const results = pickleProducts.filter(
    (p) =>
      (!collection || p.collectionId === collection.id) &&
      (selected === "all" || selected === p.id) &&
      `${p.name} ${p.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="pickle-page">
      <div className="pickle-page-heading section-pad">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>{collection ? collection.name : "Pickles"}</span>
        </nav>
        <span className="eyebrow">TROPICAL FEAST / THE COMPLETE RANGE</span>
        <h1>
          {collection
            ? "The Tropical Feast pair."
            : cataloguePath === "/shop"
              ? "The pickle pantry."
              : "Two flavours. Your pick."}
        </h1>
        <p>
          Explore Pineapple Pickle and Cucumber Pickle. Two distinctive
          flavours, one Tropical Feast: crisp, spicy and tangy.
        </p>
      </div>
      <section
        className="pickle-catalogue section-pad"
        id="pickle-grid"
        aria-labelledby="pickle-grid-title"
      >
        <div className="section-heading">
          <h2 id="pickle-grid-title">Find your flavour.</h2>
          <a className="text-link" href="/ordering">
            How to order <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-toolbar">
          <div className="filters" aria-label="Pickle flavour">
            {[{ id: "all", name: "All pickles" }, ...pickleProducts].map(
              (p) => (
                <button
                  key={p.id}
                  aria-pressed={selected === p.id}
                  className={selected === p.id ? "active" : ""}
                  onClick={() => setSelected(p.id)}
                >
                  {p.name}
                </button>
              ),
            )}
          </div>
          <label className="pickle-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search pickles</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pineapple or cucumber…"
            />
          </label>
        </div>
        {loading && <p role="status">Checking the latest pantry…</p>}
        {error && (
          <div className="catalogue-warning" role="status">
            {error}{" "}
            <button className="text-link" onClick={refresh}>
              Try again
            </button>
          </div>
        )}
        <p className="pickle-results" role="status">
          {results.length} {results.length === 1 ? "flavour" : "flavours"} ·
          Delivery by location · Confirm availability
        </p>
        <div className="pickle-grid">
          {results.map((p) => (
            <PickleCard product={p} key={p.id} />
          ))}
        </div>
        {!results.length && (
          <div className="empty-results">
            <h3>No pickles found.</h3>
            <p>Try pineapple or cucumber.</p>
            <button
              className="button primary"
              onClick={() => {
                setQuery("");
                setSelected("all");
              }}
            >
              Reset search
            </button>
          </div>
        )}
      </section>
      <PairPick />
      <ShoppingConfidence />
      <TropicalOrdering />
    </div>
  );
}
export function PickleProductPage({ product: p }: { product: PickleProduct }) {
  const { products: pickleProducts } = useCatalogue();
  const c = collectionFor(p);
  return (
    <div className="pickle-product-page">
      <nav className="breadcrumbs section-pad" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/shop">Pickles</a>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <section className="pickle-detail section-pad">
        <figure className="pickle-detail-image">
          <ProductGallery product={p} />
          <figcaption>Product image supplied by the owner</figcaption>
        </figure>
        <div className="pickle-detail-copy">
          <span className="eyebrow">{c.name}</span>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <p className="pickle-descriptors">
            {p.flavourDescriptors.join(" · ")}
          </p>
          <dl className="pickle-facts">
            <div>
              <dt>Price (INR)</dt>
              <dd>
                {p.price === null ? "Awaiting confirmation" : money(p.price)}
              </dd>
            </div>
            <div>
              <dt>Jar size</dt>
              <dd>{p.jarSize || "Awaiting confirmation"}</dd>
            </div>
            <div>
              <dt>Ingredients & allergens</dt>
              <dd>
                {p.ingredients?.join(", ") ||
                  "Not supplied — confirm before ordering"}
              </dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>
                {p.availability === "available"
                  ? "Available"
                  : p.availability === "unavailable"
                    ? "Currently unavailable"
                    : "Confirm by enquiry"}
              </dd>
            </div>
            <div>
              <dt>Service area</dt>
              <dd>{p.serviceArea}</dd>
            </div>
            <div>
              <dt>Order method</dt>
              <dd>WhatsApp or email enquiry</dd>
            </div>
          </dl>
          <p className="pickle-disclosure">
            Add your chosen flavour to your cart, then confirm the details
            before ordering. No order or payment is processed here.
          </p>
          <p className="delivery-note">{DELIVERY_NOTICE} Hyderabad only.</p>
          <SavePickle product={p} detail />
          <a
            className="text-link pickle-detail-enquiry"
            href="#tropical-ordering"
          >
            Tropical Feast enquiry <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <TropicalOrdering product={p} />
      <section className="section-pad">
        <div className="section-heading">
          <h2>Try the other flavour.</h2>
          <a className="text-link" href="/shop">
            View both flavours <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-grid">
          {pickleProducts
            .filter((other) => other.id !== p.id)
            .map((other) => (
              <PickleCard key={other.id} product={other} />
            ))}
        </div>
      </section>
    </div>
  );
}
