import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Search,
  Leaf,
  Bookmark,
  Check,
} from "lucide-react";
import {
  pickleCollections,
  pickleProducts,
  collectionFor,
  filterPickles,
  safeEnquiryUrl,
  type PickleProduct,
  type PickleCollection,
} from "../data/pickles";
import { money } from "../data/products";
import { siteConfig } from "../lib/config";
import { FruitImage } from "./Resilience";
import { usePickleSelection } from "../context/PickleSelection";

function Artwork({
  src,
  alt,
  hero = false,
  concept = false,
}: {
  src: string;
  alt: string;
  hero?: boolean;
  concept?: boolean;
}) {
  return (
    <figure className="pickle-artwork">
      <FruitImage
        src={src}
        alt={alt}
        width="1000"
        height="800"
        loading={hero ? "eager" : "lazy"}
        fetchPriority={hero ? "high" : "auto"}
      />
      <figcaption>
        {concept
          ? "AI-created concept imagery · actual product photography pending"
          : "Illustrative composition · product photography pending"}
      </figcaption>
    </figure>
  );
}
export function PickleHero() {
  return (
    <section className="pickle-hero" aria-labelledby="pickle-hero-title">
      <div className="pickle-hero-copy">
        <span className="eyebrow">
          <Leaf size={15} /> FRUITY / THE PICKLE EDIT
        </span>
        <h1 id="pickle-hero-title">
          A little tang.
          <br />
          <em>A lot of</em>
          <br />
          character.
        </h1>
        <p>
          Discover a new side of the pantry. Two distinct pickle collections,
          thoughtfully presented for your everyday meals.
        </p>
        <div className="pickle-hero-actions">
          <a className="button primary" href="/pickles">
            Explore pickles <ArrowUpRight size={18} />
          </a>
          <a className="text-link" href="/collections/tropical-feast">
            Discover Tropical Feast <ArrowRight size={16} />
          </a>
        </div>
        <div className="pickle-hero-note">
          <span>FERMENTED PICKLES</span>
          <span>Made for your mindful food moments.</span>
        </div>
      </div>
      <div className="pickle-hero-visual">
        <span className="pickle-art-index" aria-hidden="true">
          THE PANTRY EDIT / 01
        </span>
        <Artwork
          hero
          concept
          src="/images/pickles/pantry-editorial-concept.webp"
          alt="AI-created concept scene of golden-lidded cucumber and pale vegetable pickle jars on a naturally lit tabletop; actual products unverified"
        />
        <span className="pickle-art-caption">
          A little tang goes a long way.
        </span>
      </div>
    </section>
  );
}
function PickleCard({ product: p }: { product: PickleProduct }) {
  const selection = usePickleSelection();
  const collection = collectionFor(p);
  return (
    <article className={`pickle-card ${p.collectionId}`}>
      <a
        href={`/products/${p.id}`}
        className="pickle-card-image"
        aria-label={`View ${p.name} — ${collection.name}`}
      >
        <FruitImage
          src={p.image}
          alt={p.imageAlt}
          width="480"
          height="570"
          loading="lazy"
        />
        <span className="pickle-card-arrow" aria-hidden="true">
          <ArrowUpRight size={20} />
        </span>
        <small>Jar illustration · photo pending</small>
      </a>
      {selection && (
        <button
          className="pickle-save"
          aria-label={`${selection.ids.includes(p.id) ? "Unsave" : "Save"} ${p.name} — ${collection.name}`}
          aria-pressed={selection.ids.includes(p.id)}
          onClick={() => selection.toggle(p.id)}
        >
          {selection.ids.includes(p.id) ? (
            <Check size={17} />
          ) : (
            <Bookmark size={17} />
          )}
        </button>
      )}
      <div className="pickle-card-copy">
        <a href={`/collections/${collection.id}`} className="eyebrow">
          {collection.name}
        </a>
        <h3>
          <a href={`/products/${p.id}`}>{p.name}</a>
        </h3>
        {p.flavourDescriptors.length > 0 && (
          <p className="pickle-descriptors">
            {p.flavourDescriptors.join(" · ")}
          </p>
        )}
        <p className="pickle-card-pending">
          {p.price === null ? "Price awaiting confirmation" : money(p.price)} ·{" "}
          {p.jarSize || "Jar size awaiting confirmation"}
        </p>
        <a className="text-link" href={`/products/${p.id}`}>
          Details & enquiry <ArrowUpRight size={16} />
        </a>
      </div>
    </article>
  );
}
function CollectionFeature({
  collection: c,
}: {
  collection: PickleCollection;
}) {
  const tropical = c.id === "tropical-feast";
  return (
    <section
      className={`pickle-feature ${tropical ? "is-tropical" : ""}`}
      aria-labelledby={`${c.id}-title`}
    >
      <div className="pickle-feature-copy">
        <span className="eyebrow">
          {tropical ? "02 / TROPICAL FEAST" : "01 / FERMENTED PICKLES"}
        </span>
        <h2 id={`${c.id}-title`}>{c.name}</h2>
        <p className="pickle-feature-headline">{c.headline}</p>
        <p>{c.description}</p>
        <p className="pickle-feature-tagline">{c.tagline}</p>
        {c.promotionalMessages.length > 0 && (
          <p className="pickle-poster-copy">
            <span>{c.promotionalMessages.join(" · ")}</span>
            <small>
              Supplied promotional wording · ingredient list awaiting
              confirmation
            </small>
          </p>
        )}
        {c.descriptors.length > 0 && (
          <span className="pickle-descriptors">
            {c.descriptors.join(" · ")}
          </span>
        )}
        <a className="button primary" href={`/collections/${c.id}`}>
          Explore the collection <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="pickle-feature-jars">
        {pickleProducts
          .filter((p) => p.collectionId === c.id)
          .map((p) => (
            <a href={`/products/${p.id}`} key={p.id}>
              <FruitImage
                src={p.image}
                alt={p.imageAlt}
                width="480"
                height="570"
                loading="lazy"
              />
              <span>{p.name}</span>
            </a>
          ))}
        <small>Illustrative jars · photography pending</small>
      </div>
    </section>
  );
}
export function PickleCraft() {
  return (
    <section className="pickle-craft section-pad">
      <Artwork
        src="/images/pickles/tabletop.svg"
        alt="Illustrative tabletop with cucumber slices, pineapple pieces, botanical leaves and pickle jars"
      />
      <div>
        <span className="eyebrow">THE LITTLE DETAILS</span>
        <h2>
          A little tang.
          <br />
          <em>A lot of character.</em>
        </h2>
        <p>
          Explore distinctive pickle varieties with fresh-looking ingredients
          and flavour-led presentation.
        </p>
        <p>
          Every variety has its own story. Confirm ingredients, jar sizes and
          product details with the relevant supplier before ordering.
        </p>
        <a className="text-link" href="/pickles#pickle-grid">
          Find your pickle <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
export function TropicalOrdering() {
  const link = safeEnquiryUrl(siteConfig.tropicalFeastDmUrl);
  return (
    <section
      className="pickle-ordering section-pad"
      id="tropical-ordering"
      aria-labelledby="tropical-ordering-title"
    >
      <div>
        <span className="eyebrow">
          <MapPin size={16} /> TROPICAL FEAST ONLY
        </span>
        <h2 id="tropical-ordering-title">Available in Hyderabad.</h2>
        <p>
          Tropical Feast enquiries are by direct message. This service area
          applies only to Tropical Feast; other collections have their own
          arrangements.
        </p>
      </div>
      <div className="pickle-order-action">
        {link ? (
          <>
            <a
              className="button primary"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              DM Tropical Feast <ArrowUpRight size={18} />
            </a>
            <p>
              Opens the configured external DM channel. Confirm price,
              availability, ingredients and delivery directly before ordering.
            </p>
          </>
        ) : (
          <>
            <span className="pickle-unconfigured">
              Ordering channel awaiting confirmation
            </span>
            <p>
              No DM account has been supplied. Enquiries are not currently sent
              from this website.
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
export function PickleHome() {
  return (
    <div className="pickle-home" id="collections">
      <div className="pickle-intro section-pad">
        <span className="eyebrow">THE PANTRY COLLECTIONS</span>
        <h2>
          Two collections.
          <br />
          <em>Distinct personalities.</em>
        </h2>
        <p>
          Presented together for discovery. Seller relationships and shared
          ownership have not been verified.
        </p>
      </div>
      {pickleCollections.map((c) => (
        <CollectionFeature collection={c} key={c.id} />
      ))}
      <section className="section-pad" id="pickle-grid">
        <div className="section-heading">
          <h2>Meet the pantry picks.</h2>
          <a href="/pickles" className="text-link">
            All pickles <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-grid">
          {pickleProducts.map((p) => (
            <PickleCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <PickleCraft />
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
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const results = filterPickles(collection?.id || selected, query);
  return (
    <div className="pickle-page">
      <div className="pickle-page-heading section-pad">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/pickles">Pickles</a>
          {collection && (
            <>
              <span>/</span>
              <span>{collection.name}</span>
            </>
          )}
        </nav>
        <span className="eyebrow">
          {collection ? "THE PANTRY COLLECTION" : "A NEW SIDE OF THE PANTRY"}
        </span>
        <h1>
          {collection?.name ||
            (cataloguePath === "/shop"
              ? "The pickle pantry."
              : "Meet your next little obsession.")}
        </h1>
        <p>
          {collection?.description ||
            "Explore Fermented Pickles and Tropical Feast. Four entries, two distinct collections — with product details kept clear, and unknowns left honest."}
        </p>
        {collection && (
          <p className="pickle-feature-tagline">{collection.tagline}</p>
        )}
        {collection && collection.promotionalMessages.length > 0 && (
          <p className="pickle-poster-copy">
            <span>{collection.promotionalMessages.join(" · ")}</span>
            <small>
              Supplied promotional wording · ingredient list awaiting
              confirmation
            </small>
          </p>
        )}
        {!collection && (
          <p className="pickle-disclosure">
            These collections are presented separately. A shared seller or
            ownership has not been established.
          </p>
        )}
      </div>
      {collection && (
        <Artwork
          src={
            collection.id === "fermented-pickles"
              ? "/images/pickles/fermented-scene.svg"
              : "/images/pickles/tabletop.svg"
          }
          alt={`Illustrative jar composition for ${collection.name}; actual product photographs pending`}
        />
      )}
      <section
        className="pickle-catalogue section-pad"
        id="pickle-grid"
        aria-labelledby="pickle-grid-title"
      >
        <div className="section-heading">
          <h2 id="pickle-grid-title">
            {collection ? "Inside the collection." : "Find your flavour."}
          </h2>
          <a className="text-link" href="/ordering">
            How to order <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-toolbar">
          {!collection && (
            <div className="filters" aria-label="Pickle collection">
              {[{ id: "all", name: "All pickles" }, ...pickleCollections].map(
                (c) => (
                  <button
                    key={c.id}
                    aria-pressed={selected === c.id}
                    className={selected === c.id ? "active" : ""}
                    onClick={() => setSelected(c.id)}
                  >
                    {c.name}
                  </button>
                ),
              )}
            </div>
          )}
          <label className="pickle-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search pickles</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cucumber, pineapple…"
            />
          </label>
        </div>
        <p className="pickle-results" role="status">
          {results.length} {results.length === 1 ? "pickle" : "pickles"} ·
          Prices, sizes and availability not yet confirmed
        </p>
        <div className="pickle-grid">
          {results.map((p) => (
            <PickleCard key={p.id} product={p} />
          ))}
        </div>
        {results.length === 0 && (
          <div className="empty-results">
            <h3>No pickles found.</h3>
            <p>Try a product or collection name.</p>
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
      {collection?.id !== "fermented-pickles" && <TropicalOrdering />}
      <PickleCraft />
    </div>
  );
}
export function PickleProductPage({ product: p }: { product: PickleProduct }) {
  const c = collectionFor(p);
  const selection = usePickleSelection();
  const tropical = c.id === "tropical-feast";
  return (
    <div className="pickle-product-page">
      <nav className="breadcrumbs section-pad" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/pickles">Pickles</a>
        <span>/</span>
        <a href={`/collections/${c.id}`}>{c.name}</a>
      </nav>
      <section className="pickle-detail section-pad">
        <figure className="pickle-detail-image">
          <FruitImage
            src={p.image}
            alt={p.imageAlt}
            width="480"
            height="570"
            fetchPriority="high"
          />
          <figcaption>
            Illustrative jar · actual product photography pending
          </figcaption>
        </figure>
        <div className="pickle-detail-copy">
          <a className="eyebrow" href={`/collections/${c.id}`}>
            {c.name}
          </a>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          {p.flavourDescriptors.length > 0 && (
            <p className="pickle-descriptors">
              {p.flavourDescriptors.join(" · ")}
            </p>
          )}
          <dl className="pickle-facts">
            <div>
              <dt>Price (INR)</dt>
              <dd>
                {p.price === null ? "Awaiting confirmation" : `₹${p.price}`}
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
              <dd>Not yet confirmed</dd>
            </div>
            <div>
              <dt>Service area</dt>
              <dd>{p.serviceArea || "Not confirmed for this collection"}</dd>
            </div>
            <div>
              <dt>Order method</dt>
              <dd>
                {p.orderMethod === "direct-message"
                  ? "Direct message · see channel status below"
                  : "Not confirmed for this collection"}
              </dd>
            </div>
          </dl>
          <p className="pickle-disclosure">
            Price and ordering details are awaiting confirmation. Save this
            pickle to your enquiry list, then confirm the details with its
            supplier. No order or payment is processed here.
          </p>
          {selection && (
            <button
              className="button primary pickle-save-detail"
              aria-pressed={selection.ids.includes(p.id)}
              onClick={() => selection.toggle(p.id)}
            >
              {selection.ids.includes(p.id)
                ? "Saved to enquiry list"
                : "Save to enquiry list"}
              <Bookmark size={17} />
            </button>
          )}
          <a
            className="text-link pickle-detail-enquiry"
            href={tropical ? "#tropical-ordering" : "#pickle-enquiry"}
          >
            {tropical ? "Tropical Feast enquiry" : "Check enquiry details"}{" "}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      {tropical ? (
        <TropicalOrdering />
      ) : (
        <section className="pickle-enquiry section-pad" id="pickle-enquiry">
          <span className="eyebrow">FERMENTED PICKLES / ENQUIRIES</span>
          <h2>Let’s keep the details clear.</h2>
          <p>
            No verified supplier contact, order method or service area has been
            supplied for Fermented Pickles. This website cannot send an enquiry
            for this collection yet.
          </p>
          <a className="text-link" href="/contact">
            Website contact information <ArrowUpRight size={16} />
          </a>
        </section>
      )}
      <section className="section-pad">
        <div className="section-heading">
          <h2>More from {c.name}.</h2>
          <a className="text-link" href={`/collections/${c.id}`}>
            View collection <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="pickle-grid">
          {pickleProducts
            .filter((other) => other.collectionId === c.id && other.id !== p.id)
            .map((other) => (
              <PickleCard key={other.id} product={other} />
            ))}
        </div>
      </section>
    </div>
  );
}
