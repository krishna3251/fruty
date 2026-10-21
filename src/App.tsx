import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Leaf,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sprout,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import gsap from "gsap";
import { motion, useReducedMotion } from "framer-motion";
import {
  products,
  categories,
  money,
  asset,
  type Product,
  type Category,
} from "./data/products";
import { useCart } from "./context/CartContext";
import { MAX_QUANTITY } from "./context/cartModel";
import Showcase from "./components/Showcase";
import Modal from "./components/Modal";
type Overlay = "cart" | "checkout" | "account" | "info" | null;
const infoContent: Record<string, string> = {
  "Delivery & freshness":
    "This is a demonstration store. Delivery is not connected and no order will be fulfilled. A production store would show serviceable PIN codes, delivery slots, shipping fees, and freshness guarantees here.",
  "Returns & refunds":
    "Demo policy: no purchases or charges are made on this website. Before launch, the store owner must publish an approved policy for damaged produce, return windows, and refunds.",
  "Privacy policy":
    "Your shopping bag is stored only in this browser. Newsletter and checkout submissions are demonstrations and are not sent to a server. No payment or account information is collected. Product images are served locally.",
  "Contact us":
    "This concept store does not yet have a customer support team. No contact or social account is presented as an active service. For the website project, visit github.com/krishna3251/fruty.",
  "Social updates":
    "Our social channels are still growing. This demo does not link to unverified social profiles. Explore our seasonal collections while we get ready.",
};
function Quantity({ id, name }: { id: string; name: string }) {
  const { items, change } = useCart();
  return (
    <div className="quantity">
      <button
        aria-label={`Decrease ${name} quantity`}
        onClick={() => change(id, -1)}
      >
        <Minus size={15} />
      </button>
      <output aria-label={`${name} quantity`}>{items[id] || 0}</output>
      <button
        disabled={(items[id] || 0) >= MAX_QUANTITY}
        aria-label={`Increase ${name} quantity`}
        onClick={() => change(id, 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
function ProductCard({
  product: p,
  onProduct,
  onAdd,
}: {
  product: Product;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const { items } = useCart();
  return (
    <article className="product-card">
      <button
        className="product-visual"
        style={{ background: p.color }}
        onClick={() => onProduct(p)}
        aria-label={`View ${p.name}`}
      >
        <span className="product-label">{p.label}</span>
        <img
          src={asset(p.image)}
          alt={p.name}
          width="480"
          height="400"
          loading="lazy"
        />
        <span className="quick-view">
          Take a closer look <ArrowUpRight size={16} />
        </span>
      </button>
      <div className="product-info">
        <button className="product-name" onClick={() => onProduct(p)}>
          {p.name}
        </button>
        <span>{money(p.price)}</span>
      </div>
      <p className="weight">{p.weight}</p>
      <div className="product-actions">
        <span className={`availability ${p.available ? "" : "unavailable"}`}>
          <i />
          {p.available ? "Ready for your fruit bowl" : "Out of season"}
        </span>
        {items[p.id] ? (
          <Quantity id={p.id} name={p.name} />
        ) : (
          <button
            className="add-button"
            disabled={!p.available}
            onClick={() => onAdd(p)}
            aria-label={`Add ${p.name} to bag`}
          >
            <Plus size={19} />
          </button>
        )}
      </div>
    </article>
  );
}
export default function App() {
  const cart = useCart();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [info, setInfo] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [category, setCategory] = useState<Category>("All fruit");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [ready, setReady] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const close = useCallback(() => {
    setOverlay(null);
    setDetail(null);
    setCheckoutDone(false);
  }, []);
  useEffect(() => {
    setReady(true);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.fromTo(
        ".hero-main-fruit",
        { y: 0, rotation: -8 },
        {
          y: -35,
          rotation: 4,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
          ease: "none",
        },
      );
    }, heroRef);
    return () => ctx.revert();
  }, [reduced]);
  const filtered = useMemo(() => {
    const result = products.filter(
      (p) =>
        (category === "All fruit" || category === p.category) &&
        `${p.name} ${p.subtitle} ${p.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    return sort === "featured"
      ? result
      : [...result].sort((a, b) =>
          sort === "low" ? a.price - b.price : b.price - a.price,
        );
  }, [category, query, sort]);
  useLayoutEffect(() => {
    if (reduced || !ready || !filtered.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".product-card",
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.07,
          duration: 0.55,
          scrollTrigger: { trigger: gridRef.current, start: "top 92%" },
        },
      );
    }, gridRef);
    return () => ctx.revert();
  }, [filtered, ready, reduced]);
  const add = (p: Product) => {
    if ((cart.items[p.id] || 0) >= MAX_QUANTITY) {
      setNotice("Maximum 20 packs per fruit in this demo.");
      return;
    }
    cart.change(p.id, 1);
    setNotice(`${p.name} added to your bag`);
  };
  const openInfo = (title: string) => {
    setInfo(title);
    setOverlay("info");
  };
  const showProduct = (p: Product) => {
    setOverlay(null);
    setDetail(p);
  };
  const browse = (c: Category) => {
    setCategory(c);
    setQuery("");
    document
      .getElementById("shop")
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  return (
    <>
      <a className="skip-link" href="#shop">
        Skip to shop
      </a>
      <div className="announcement">
        <span>GOOD FRUIT. GOOD MOOD. EVERY DAY.</span>
        <span>
          Demo store <i /> A fresh idea, coming to life
        </span>
      </div>
      <header className="header">
        <a href="#" className="logo" aria-label="furity home">
          furity<span>✳</span>
        </a>
        <nav
          aria-label="Main navigation"
          className={mobileMenu ? "navigation is-open" : "navigation"}
        >
          <a href="#shop" onClick={() => setMobileMenu(false)}>
            Shop fresh <ArrowDownRight size={13} />
          </a>
          <a href="#collections" onClick={() => setMobileMenu(false)}>
            In season
          </a>
          <a href="#story" onClick={() => setMobileMenu(false)}>
            Our story
          </a>
        </nav>
        <div className="nav-tools">
          <button
            className="icon-button"
            aria-label="Search fruit"
            onClick={() => {
              setSearchOpen((v) => !v);
              document
                .getElementById("shop")
                ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
            }}
          >
            <Search size={20} />
          </button>
          <button
            className="icon-button account-button"
            aria-label="Your account"
            onClick={() => setOverlay("account")}
          >
            <UserRound size={20} />
          </button>
          <button
            className="bag-button"
            onClick={() => setOverlay("cart")}
            aria-label={`Open bag, ${cart.count} items`}
          >
            <ShoppingBag size={19} />
            <span className="bag-text">Bag</span>
            <span className="bag-count">{cart.count}</span>
          </button>
          <button
            className="icon-button menu-button"
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero" ref={heroRef}>
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="green-dot" /> FRESH FROM NATURE. FULL OF LIFE.
            </span>
            <h1>
              Freshness,
              <br />
              in full <span>color.</span>
            </h1>
            <p>
              Good days start with great fruit.
              <br />
              Discover nature’s sweetest picks, handpicked
              <br className="desktop-br" /> for your everyday little joys.
            </p>
            <a className="button primary" href="#shop">
              Shop fresh picks <ArrowUpRight size={18} />
            </a>
            <div className="hero-proof">
              <div className="tiny-fruits">
                <img src={asset("strawberry")} width="40" height="40" alt="" />
                <img src={asset("orange")} width="40" height="40" alt="" />
                <img src={asset("blueberry")} width="40" height="40" alt="" />
              </div>
              <span>
                Nothing extra.
                <br />
                <strong>Just naturally good.</strong>
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-circle" />
            <div className="hero-background-word" aria-hidden="true">
              oh,
              <br />
              mango!
            </div>
            <div className="hero-main-fruit">
              <img
                src={asset("mango")}
                width="780"
                height="650"
                alt="Ripe golden mangoes with a freshly cut mango cheek"
                fetchPriority="high"
              />
            </div>
            <img
              className="hero-satellite satellite-one"
              src={asset("mango")}
              width="160"
              height="140"
              alt=""
            />
            <img
              className="hero-satellite satellite-two"
              src={asset("lemon")}
              width="160"
              height="140"
              alt=""
            />
            <span className="fruit-spark spark-one">✳</span>
            <span className="fruit-spark spark-two">✳</span>
            <div className="round-seal">
              <Sprout size={22} />
              <span>
                100% FRUIT
                <br />
                100% FEEL-GOOD
              </span>
            </div>
            <button
              className="hero-product-link"
              onClick={() => showProduct(products[0])}
            >
              <span>
                THE SEASON’S GOLDEN CHILD<strong>Alphonso Mangoes</strong>
              </span>
              <span className="circle-arrow">
                <ArrowUpRight size={21} />
              </span>
            </button>
          </div>
          <div className="hero-bottom">
            <span>A LITTLE FRESHNESS GOES A LONG WAY.</span>
            <a href="#collections">
              Scroll to taste the season <ArrowDown size={16} />
            </a>
            <span>01 — 04</span>
          </div>
        </section>
        <div className="promise-strip">
          <span>
            <Leaf size={17} /> Naturally delicious
          </span>
          <i>✳</i>
          <span>
            <Sprout size={18} /> Seasonally selected
          </span>
          <i>✳</i>
          <span>
            <PackageCheck size={18} /> Packed with care
          </span>
          <i>✳</i>
          <span>GOODNESS, WITHOUT THE GUESSWORK.</span>
        </div>
        <section className="collection-intro section-pad">
          <div>
            <span className="eyebrow">A HARVEST OF HAPPY</span>
            <h2>
              Nature has
              <br />a colorful side.
            </h2>
          </div>
          <div>
            <p>
              Four delicious reasons to fall in love
              <br />
              with the season. Find your flavor.
            </p>
            <a href="#shop" className="text-link">
              Or, head straight to the shop <ArrowDownRight size={18} />
            </a>
          </div>
          <span className="intro-star" aria-hidden="true">
            ✳
          </span>
        </section>
        <Showcase onProduct={showProduct} />
        <section
          className="shop section-pad"
          id="shop"
          aria-labelledby="shop-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR DAILY DOSE OF DELICIOUS</span>
              <h2 id="shop-title">Fresh picks. Happy days.</h2>
            </div>
            <p>
              Fill your bowl with something good.
              <br />
              <span className="sample-note">
                Sample products, prices & availability.
              </span>
            </p>
          </div>
          <div className="shop-toolbar">
            <div className="filters" aria-label="Fruit category">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                  {c === "All fruit" && <small>06</small>}
                </button>
              ))}
            </div>
            <div className="shop-controls">
              <button
                className="icon-button"
                aria-expanded={searchOpen}
                aria-label="Show product search"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search size={19} />
              </button>
              <label className="sort">
                <SlidersHorizontal size={16} />
                <span className="sr-only">Sort products</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>
          {(searchOpen || query) && (
            <div className="search-field">
              <Search size={19} />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find your favorite fruit…"
                aria-label="Search products"
              />
              <button
                className="icon-button"
                aria-label="Clear and close search"
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="results-count" aria-live="polite">
            {ready
              ? `${filtered.length} fresh finds`
              : "Gathering the good stuff…"}
          </div>
          <div className="product-grid" ref={gridRef}>
            {ready
              ? filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onProduct={showProduct}
                    onAdd={add}
                  />
                ))
              : Array.from({ length: 3 }, (_, i) => (
                  <div
                    className="product-skeleton"
                    key={i}
                    aria-hidden="true"
                  />
                ))}
          </div>
          {ready && !filtered.length && (
            <div className="empty-state">
              <Search size={32} />
              <h3>No fruit found. Yet.</h3>
              <p>Try another search or explore the whole harvest.</p>
              <button
                className="button primary"
                onClick={() => {
                  setQuery("");
                  setCategory("All fruit");
                }}
              >
                Show all fruit <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
        <section className="seasonal section-pad">
          <div>
            <span className="eyebrow">THE LITTLE JOYS COLLECTION</span>
            <h2>
              Berry good
              <br />
              company.
            </h2>
            <p>
              Breakfast bowls. Picnic days. Midnight snacks.
              <br />
              There’s a berry for every little moment.
            </p>
            <button
              className="button primary"
              onClick={() => browse("Berries")}
            >
              Meet the berry bunch <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="seasonal-art">
            <span aria-hidden="true">
              sweet
              <br />
              together.
            </span>
            <img
              className="season-berry"
              src={asset("strawberry")}
              width="450"
              height="400"
              loading="lazy"
              alt="Fresh red strawberries"
            />
            <img
              className="season-blue"
              src={asset("blueberry")}
              width="320"
              height="280"
              loading="lazy"
              alt="Plump blueberries"
            />
            <i aria-hidden="true">✳</i>
          </div>
        </section>
        <section className="bestsellers section-pad">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE FRUIT BOWL FAVORITES</span>
              <h2>Good taste gets around.</h2>
            </div>
            <a href="#shop" className="text-link">
              Shop the whole harvest <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="bestseller-list">
            {[products[0], products[2], products[1]].map((p, i) => (
              <button key={p.id} onClick={() => showProduct(p)}>
                <span className="best-number">0{i + 1}</span>
                <img
                  src={asset(p.image)}
                  alt=""
                  width="100"
                  height="85"
                  loading="lazy"
                />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.subtitle}</small>
                </span>
                <span>{money(p.price)}</span>
                <ArrowUpRight size={23} />
              </button>
            ))}
          </div>
        </section>
        <section className="story section-pad" id="story">
          <div className="story-title">
            <span className="eyebrow">A FRESH PERSPECTIVE</span>
            <h2>
              Less fuss.
              <br />
              More <em>fruit.</em>
            </h2>
            <p>
              We believe the best things in life don’t need much dressing up.
              Just sunshine, a little patience, and a lot of care.
            </p>
            <p>
              Furity is a concept for a simpler, more colorful way to shop
              seasonal fruit. A small celebration of food that feels as good as
              it tastes.
            </p>
            <a className="text-link" href="#shop">
              Find your feel-good fruit <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="values">
            <article>
              <Sprout />
              <span>01</span>
              <h3>Goodness starts at the source.</h3>
              <p>
                A seasonal approach, with origin information for every fruit in
                our sample collection.
              </p>
            </article>
            <article>
              <CheckCircle2 />
              <span>02</span>
              <h3>Only the good stuff.</h3>
              <p>
                Freshness and flavor first. Thoughtfully selected fruit, without
                the unnecessary extras.
              </p>
            </article>
            <article>
              <PackageCheck />
              <span>03</span>
              <h3>A little care goes a long way.</h3>
              <p>
                Our vision: thoughtful packaging that helps every piece arrive
                ready for its moment.
              </p>
            </article>
          </div>
        </section>
        <section className="reviews section-pad">
          <span className="eyebrow">SOME FEEL-GOOD WORDS · DEMO REVIEWS</span>
          <div className="review-grid">
            {[
              {
                text: "The mangoes taste like summer holidays. Sweet, fragrant, and gone way too quickly.",
                name: "Ananya",
                city: "Mumbai",
              },
              {
                text: "Finally, a fruit bowl that looks as good as it tastes. The little things really do make a day.",
                name: "Rahul",
                city: "Bengaluru",
              },
              {
                text: "My morning yogurt has found its perfect match. Those blueberries are a little joy.",
                name: "Meera",
                city: "Hyderabad",
              },
            ].map((r) => (
              <article key={r.name}>
                <div className="stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star size={14} key={i} fill="currentColor" />
                  ))}
                </div>
                <blockquote>“{r.text}”</blockquote>
                <span>
                  {r.name} <small> / {r.city} · fictional review</small>
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="newsletter section-pad">
          <div>
            <span className="eyebrow">A LITTLE GOODNESS IN YOUR INBOX</span>
            <h2>Stay in the fresh.</h2>
            <p>
              Seasonal stories, fruity ideas, and first dibs on the good stuff.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubscribed(true);
            }}
          >
            {subscribed ? (
              <div className="newsletter-success" role="status">
                <Check size={22} />
                <span>
                  You’re on the list — in spirit!
                  <small>Demo signup. Your email has not been submitted.</small>
                </span>
              </div>
            ) : (
              <>
                <label htmlFor="newsletter-email" className="sr-only">
                  Your email address
                </label>
                <div className="newsletter-input">
                  <input
                    type="email"
                    id="newsletter-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                  <button aria-label="Join newsletter">
                    <ArrowRight size={23} />
                  </button>
                </div>
                <small>
                  Just a taste of what’s to come. Demo signup, no emails sent.
                </small>
              </>
            )}
          </form>
        </section>
      </main>
      <footer className="footer section-pad">
        <div className="footer-top">
          <a className="logo" href="#">
            furity<span>✳</span>
          </a>
          <p>
            Fresh fruit.
            <br />A brighter everyday.
          </p>
          <div>
            <span>EXPLORE</span>
            <a href="#shop">Shop all fruit</a>
            <a href="#collections">Seasonal collections</a>
            <a href="#story">Our story</a>
          </div>
          <div>
            <span>HERE TO HELP</span>
            {["Delivery & freshness", "Returns & refunds", "Contact us"].map(
              (t) => (
                <button key={t} onClick={() => openInfo(t)}>
                  {t}
                </button>
              ),
            )}
          </div>
          <div>
            <span>FIND YOUR FRESH</span>
            <button onClick={() => openInfo("Social updates")}>
              Instagram <ArrowUpRight size={12} />
            </button>
            <button onClick={() => openInfo("Social updates")}>
              Pinterest <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">
          naturally happy.
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} furity. A fresh concept.</span>
          <span>Demo storefront · no real orders or payments.</span>
          <a href="https://pngimg.com" target="_blank" rel="noreferrer">
            Fruit images: pngimg.com
          </a>
          <button onClick={() => openInfo("Privacy policy")}>
            Privacy policy
          </button>
          <a
            href="https://github.com/krishna3251/fruty"
            target="_blank"
            rel="noreferrer"
          >
            Made to grow <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      <motion.div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
        animate={{ y: notice ? 0 : 20, opacity: notice ? 1 : 0 }}
      >
        <CheckCircle2 size={19} />
        {notice}
        <button
          onClick={() => {
            setNotice("");
            setOverlay("cart");
          }}
        >
          View bag <ArrowRight size={14} />
        </button>
      </motion.div>
      {detail && (
        <Modal title={detail.name} onClose={close}>
          <div className="detail-image" style={{ background: detail.color }}>
            <img
              src={asset(detail.image)}
              alt={detail.name}
              width="500"
              height="350"
            />
          </div>
          <div className="detail-content">
            <span className="eyebrow">{detail.origin} · SAMPLE PRODUCT</span>
            <p>{detail.description}</p>
            <div className="detail-price">
              <strong>{money(detail.price)}</strong>
              <span>{detail.weight}</span>
            </div>
            <div className="storage">
              <Leaf size={18} />
              <p>
                <strong>A little care tip</strong>
                {detail.storage}
              </p>
            </div>
            {cart.items[detail.id] ? (
              <div className="detail-added">
                <Quantity id={detail.id} name={detail.name} />
                <button
                  className="button primary"
                  onClick={() => {
                    setDetail(null);
                    setOverlay("cart");
                  }}
                >
                  View your bag <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <button
                className="button primary full"
                disabled={!detail.available}
                onClick={() => add(detail)}
              >
                {detail.available ? "Add a little goodness" : "Out of season"}
                <Plus size={18} />
              </button>
            )}
            <small className="demo-disclaimer">
              Demo availability. No live inventory or delivery connection.
            </small>
          </div>
        </Modal>
      )}
      {overlay === "cart" && (
        <Modal
          title={`Your fresh picks (${cart.count})`}
          onClose={close}
          drawer
        >
          {cart.count ? (
            <>
              <div className="cart-items">
                {products
                  .filter((p) => cart.items[p.id])
                  .map((p) => (
                    <article className="cart-item" key={p.id}>
                      <button
                        style={{ background: p.color }}
                        className="cart-image"
                        aria-label={`View ${p.name}`}
                        onClick={() => showProduct(p)}
                      >
                        <img
                          src={asset(p.image)}
                          alt=""
                          width="110"
                          height="110"
                        />
                      </button>
                      <div>
                        <h3>{p.name}</h3>
                        <p>{p.weight}</p>
                        <Quantity id={p.id} name={p.name} />
                      </div>
                      <div className="cart-item-end">
                        <strong>{money(p.price * cart.items[p.id])}</strong>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => cart.remove(p.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              <div className="cart-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(cart.subtotal)}</strong>
                </div>
                <p>Demo bag · shipping and taxes are not calculated.</p>
                <button
                  className="button primary full"
                  onClick={() => setOverlay("checkout")}
                >
                  Continue to demo checkout <ArrowRight size={18} />
                </button>
                <button className="text-link centered" onClick={close}>
                  Keep exploring
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={48} strokeWidth={1} />
              <h3>
                A little empty.
                <br />A lot of possibility.
              </h3>
              <p>Your next feel-good bite is waiting.</p>
              <button
                className="button primary"
                onClick={() => {
                  close();
                  browse("All fruit");
                }}
              >
                Find your fresh <ArrowUpRight size={18} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {overlay === "checkout" && (
        <Modal
          title={
            checkoutDone ? "A fresh little practice run." : "Your demo checkout"
          }
          onClose={close}
        >
          {checkoutDone ? (
            <div className="empty-state">
              <CheckCircle2 size={45} />
              <h3>Demo complete!</h3>
              <p>
                No order was placed, no payment was taken, and your bag is still
                here.
              </p>
              <button className="button primary" onClick={close}>
                Back to the good stuff <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="checkout-content">
              <div className="demo-banner">
                <Leaf size={19} />
                <p>
                  This is a frontend demonstration. No payment, delivery, or
                  order processing is connected.
                </p>
              </div>
              <h3>Your harvest</h3>
              {products
                .filter((p) => cart.items[p.id])
                .map((p) => (
                  <div className="checkout-row" key={p.id}>
                    <span>
                      {p.name} × {cart.items[p.id]}
                    </span>
                    <strong>{money(p.price * cart.items[p.id])}</strong>
                  </div>
                ))}
              <div className="checkout-row total">
                <strong>Sample subtotal</strong>
                <strong>{money(cart.subtotal)}</strong>
              </div>
              <p>
                In a live store, delivery address, shipping, tax, and secure
                payment options would be added next.
              </p>
              <button
                className="button primary full"
                disabled={!cart.count}
                onClick={() => setCheckoutDone(true)}
              >
                Finish demo checkout <ArrowRight size={18} />
              </button>
              <button
                className="text-link centered"
                onClick={() => setOverlay("cart")}
              >
                Back to bag
              </button>
            </div>
          )}
        </Modal>
      )}
      {overlay === "account" && (
        <Modal title="Hello, fruit lover." onClose={close}>
          <div className="empty-state">
            <UserRound size={43} strokeWidth={1} />
            <h3>Your little corner of fresh.</h3>
            <p>
              Account sign-in and order history will be available when the store
              launches. For now, your bag is saved on this device.
            </p>
            <button
              className="button primary"
              onClick={() => setOverlay("cart")}
            >
              Open your bag <ShoppingBag size={18} />
            </button>
          </div>
        </Modal>
      )}
      {overlay === "info" && (
        <Modal title={info} onClose={close}>
          <div className="info-content">
            <p>{infoContent[info]}</p>
            {info === "Contact us" && (
              <a
                href="https://github.com/krishna3251/fruty"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                View the project <ArrowUpRight size={16} />
              </a>
            )}
            <span className="demo-disclaimer">
              Furity · demonstration storefront
            </span>
          </div>
        </Modal>
      )}
    </>
  );
}
