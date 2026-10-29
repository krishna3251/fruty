import ProductGallery from "./ProductGallery";
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
  MessageCircle,
  ClipboardList,
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
        <p className="pickle-card-description">{p.description}</p>
        <div className="product-card-price">
          <strong>
            {p.price === null ? "Price on enquiry" : money(p.price)}
          </strong>
          <span>{p.jarSize || "Size on enquiry"} / jar</span>
        </div>
        <p className="product-delivered-price">
          Hyderabad only · ₹150 standard delivery
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
          {money(pair.reduce((sum, p) => sum + p!.price!, 0))} for both jars
          <small>Plus ₹150 standard delivery per order</small>
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
          ordering. Standard delivery is ₹150 per order. Confirm coverage and
          timing on WhatsApp.
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
function ShoppingSteps() {
  return (
    <section
      className="shopping-steps section-pad"
      aria-labelledby="shopping-steps-title"
    >
      <div className="shopping-steps-intro">
        <span className="eyebrow">SIMPLE FROM START TO FINISH</span>
        <h2 id="shopping-steps-title">Your next jar in three steps.</h2>
        <p>Choose what you love and we’ll take it from there, together.</p>
        <a className="text-link" href="/ordering">
          Read the ordering guide <ArrowUpRight size={16} />
        </a>
      </div>
      <ol className="shopping-step-list">
        <li>
          <span className="shopping-step-number">01</span>
          <ShoppingBag size={21} aria-hidden="true" />
          <h3>Choose your pickles</h3>
          <p>Explore the flavours and add your favourites to the cart.</p>
        </li>
        <li>
          <span className="shopping-step-number">02</span>
          <ClipboardList size={21} aria-hidden="true" />
          <h3>Review your cart</h3>
          <p>Check your jars, quantities and the delivery estimate.</p>
        </li>
        <li>
          <span className="shopping-step-number">03</span>
          <MessageCircle size={21} aria-hidden="true" />
          <h3>Send your enquiry</h3>
          <p>Open WhatsApp or email and confirm the details with us.</p>
        </li>
      </ol>
    </section>
  );
}

export function PickleHome() {
  const { products: pickleProducts } = useCatalogue();
  return (
    <div className="pickle-home" id="collections">
      <section className="section-pad homepage-picks" id="pickle-grid">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE TROPICAL FEAST COLLECTION</span>
            <h2>Meet the pickles.</h2>
            <p>
              {pickleProducts.length === 2
                ? "Two flavours. Pick one, or make room for both."
                : "Explore the flavours and find your favourite."}
            </p>
          </div>
          <a className="text-link" href="/shop">
            View all pickles <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-grid">
          {pickleProducts.map((p) => (
            <PickleCard key={p.id} product={p} />
          ))}
        </div>
        <PairPick />
      </section>
      <ShoppingSteps />
      <section className="store-story section-pad" id="pantry-story">
        <div className="store-story-photo">
          <FruitImage
            src={brandAssets.hero}
            alt="Tropical Feast pineapple and cucumber pickle jars together"
            width="1254"
            height="1254"
            loading="lazy"
          />
        </div>
        <div className="store-story-copy">
          <span className="eyebrow">A LITTLE ABOUT TROPICAL FEAST</span>
          <h2>A little tang for the table.</h2>
          <p>
            Tropical Feast brings together two distinctive pickle flavours:
            golden pineapple and green cucumber. Discover the one you’d love to
            have with your next meal.
          </p>
          <a className="button primary" href="/shop">
            Explore the flavours <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
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
          Discover crisp, spicy and tangy pickle flavours. Choose your jars and
          send your cart to us on WhatsApp or email.
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
          ₹150 standard delivery · Confirm availability
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
        </figure>
        <div className="pickle-detail-copy">
          <span className="eyebrow">{c.name}</span>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <p className="pickle-descriptors">
            {p.flavourDescriptors.join(" · ")}
          </p>
          <div className="pickle-detail-buy">
            <p className="pickle-detail-price">
              <strong>
                {p.price === null ? "Price on enquiry" : money(p.price)}
              </strong>
              <span>{p.jarSize || "Size to confirm"} / jar</span>
            </p>
            <p className="delivery-note">{DELIVERY_NOTICE}</p>
            <SavePickle product={p} detail />
            <p className="pickle-buy-hint">
              Review your cart and enquire by WhatsApp or email. No online
              payment is taken here.
            </p>
          </div>
          <dl className="pickle-facts">
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
