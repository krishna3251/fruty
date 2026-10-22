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
  Heart,
  ArrowUp,
  Pause,
  Play,
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
import PageMetadata from "./components/PageMetadata";
import InformationPage from "./components/InformationPage";
import Newsletter from "./components/Newsletter";
import PrivacyControls from "./components/PrivacyControls";
import MobileShopCTA from "./components/MobileShopCTA";
import { trackEvent } from "./lib/analytics";
import Checkout from "./components/Checkout";
import ProductPage from "./components/ProductPage";
import MarketExtras from "./components/MarketExtras";
import { FruitImage, NotFound, OfflineNotice } from "./components/Resilience";
import { useRoute, navigate } from "./hooks/useRoute";
import { useExperience } from "./hooks/useExperience";
import {
  restoreWishlist,
  restoreReceipts,
  type DemoReceipt,
} from "./lib/store";
type Overlay = "cart" | "checkout" | "account" | "info" | "wishlist" | null;
const infoContent: Record<string, string> = {
  "Delivery & freshness":
    "This is a demonstration store. Delivery is not connected and no order will be fulfilled. A production store would show serviceable PIN codes, delivery slots, shipping fees, and freshness guarantees here.",
  "Returns & refunds":
    "Demo policy: no purchases or charges are made on this website. Before launch, the store owner must publish an approved policy for damaged produce, return windows, and refunds.",
  "Privacy policy":
    "Your bag, saved fruit, and sample receipts are stored only in this browser. Checkout contact and address fields remain in memory while the checkout is open; they are not transmitted or saved. Newsletter email is not submitted. No payment details are collected. Product images and fonts are served locally.",
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
  saved,
  onSave,
}: {
  product: Product;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
  saved: boolean;
  onSave: () => void;
}) {
  const { items } = useCart();
  return (
    <article className="product-card">
      <button
        className={`wishlist-heart ${saved ? "is-saved" : ""}`}
        aria-label={`${saved ? "Unsave" : "Save"} ${p.name}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        onPointerMove={(e) => {
          if (
            e.pointerType !== "mouse" ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;
          const box = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty(
            "--px",
            `${((e.clientX - box.left) / box.width - 0.5) * 13}px`,
          );
          e.currentTarget.style.setProperty(
            "--py",
            `${((e.clientY - box.top) / box.height - 0.5) * 13}px`,
          );
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty("--px", "0px");
          e.currentTarget.style.setProperty("--py", "0px");
        }}
        className="product-visual"
        style={{ background: p.color }}
        onClick={() => onProduct(p)}
        aria-label={`View ${p.name}`}
      >
        <span className="product-label">{p.label}</span>
        <FruitImage
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
  const route = useRoute().replace(/\/$/, "") || "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const isShop = route.replace(/\/$/, "") === "/shop";
  const pageProduct = route.startsWith("/products/")
    ? products.find((p) => p.id === route.slice(10).replace(/\/$/, ""))
    : undefined;
  const information = ["/privacy", "/terms", "/contact", "/thank-you"].includes(
    route,
  );
  const isMissing = route !== "/" && !isShop && !pageProduct && !information;
  const [motionPaused, setMotionPaused] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return restoreWishlist(localStorage.getItem("furity-saved-v1"));
    } catch {
      return [];
    }
  });
  const [receipts, setReceipts] = useState<DemoReceipt[]>(() => {
    try {
      return restoreReceipts(localStorage.getItem("furity-receipts-v1"));
    } catch {
      return [];
    }
  });
  useExperience(rootRef, route, motionPaused);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [info, setInfo] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [category, setCategory] = useState<Category>("All fruit");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<{ id: string; quantity: number } | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const close = useCallback(() => {
    setOverlay(null);
    setDetail(null);
  }, []);
  const toggleSave = (id: string) =>
    setWishlist((old) =>
      old.includes(id) ? old.filter((value) => value !== id) : [...old, id],
    );
  const saveReceipt = (receipt: DemoReceipt) =>
    setReceipts((old) => [receipt, ...old].slice(0, 10));
  useEffect(() => {
    try {
      localStorage.setItem("furity-saved-v1", JSON.stringify(wishlist));
    } catch {
      setNotice(
        "Your saved list will last for this visit. Browser storage is unavailable.",
      );
    }
  }, [wishlist]);
  useEffect(() => {
    try {
      localStorage.setItem("furity-receipts-v1", JSON.stringify(receipts));
    } catch {
      setNotice("Your receipt could not be saved on this device.");
    }
  }, [receipts]);
  useEffect(() => {
    setOverlay(null);
    setDetail(null);
    setMobileMenu(false);
  }, [route]);
  useEffect(() => {
    const outside = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenu(false);
    };
    document.addEventListener("keydown", outside);
    return () => document.removeEventListener("keydown", outside);
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
    if (reduced || motionPaused || !heroRef.current) return;
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
  }, [reduced, motionPaused, route]);
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
    if (
      reduced ||
      motionPaused ||
      !ready ||
      !filtered.length ||
      !gridRef.current
    )
      return;
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
  }, [filtered, ready, reduced, motionPaused, route]);
  const add = (p: Product, quantity = 1) => {
    setUndo(null);
    if (!p.available) {
      setNotice("This fruit is out of season. Try another fresh pick.");
      return;
    }
    if ((cart.items[p.id] || 0) >= MAX_QUANTITY) {
      setNotice("Maximum 20 packs per fruit in this demo.");
      return;
    }
    const added = Math.min(quantity, MAX_QUANTITY - (cart.items[p.id] || 0));
    cart.change(p.id, added);
    trackEvent("add_to_cart", p.id);
    setNotice(
      `${p.name} added to your bag${added < quantity ? " · 20-pack limit reached" : ""}`,
    );
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
    <div
      ref={rootRef}
      className={`storefront ${isShop ? "shop-page" : ""} ${motionPaused ? "motion-paused" : ""}`}
    >
      <PageMetadata path={route} />
      <OfflineNotice />
      <div className="reading-progress" aria-hidden="true" />
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
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="logo"
          aria-label="furity home"
        >
          furity<span>✳</span>
        </a>
        <nav
          aria-label="Main navigation"
          className={mobileMenu ? "navigation is-open" : "navigation"}
        >
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate("/shop");
              setMobileMenu(false);
            }}
          >
            Shop fresh <ArrowDownRight size={13} />
          </a>
          <a
            href="/#collections"
            onClick={(e) => {
              if (route !== "/") {
                e.preventDefault();
                navigate("/#collections");
              }
              setMobileMenu(false);
            }}
          >
            In season
          </a>
          <a
            href="/#story"
            onClick={(e) => {
              if (route !== "/") {
                e.preventDefault();
                navigate("/#story");
              }
              setMobileMenu(false);
            }}
          >
            Our story
          </a>
        </nav>
        <div className="nav-tools">
          <button
            className="icon-button saved-nav"
            aria-label={`Saved fruit, ${wishlist.length} items`}
            onClick={() => setOverlay("wishlist")}
          >
            <Heart size={19} />
            {wishlist.length > 0 && <span>{wishlist.length}</span>}
          </button>
          <button
            className="icon-button"
            aria-label="Search fruit"
            onClick={() => {
              setSearchOpen((v) => !v);
              if (route !== "/" && route !== "/shop") navigate("/shop");
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
        {information ? (
          <InformationPage path={route} />
        ) : pageProduct ? (
          <ProductPage
            product={pageProduct}
            saved={wishlist.includes(pageProduct.id)}
            onSave={() => toggleSave(pageProduct.id)}
            onAdd={add}
          />
        ) : isMissing ? (
          <NotFound />
        ) : (
          <>
            {!isShop && (
              <>
                <section className="hero" ref={heroRef}>
                  <div className="hero-copy">
                    <span className="eyebrow">
                      <span className="green-dot" /> FRESH FROM NATURE. FULL OF
                      LIFE.
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
                      <br className="desktop-br" /> for your everyday little
                      joys.
                    </p>
                    <a className="button primary" href="#shop">
                      Shop fresh picks <ArrowUpRight size={18} />
                    </a>
                    <div className="hero-proof">
                      <div className="tiny-fruits">
                        <FruitImage
                          src={asset("strawberry")}
                          width="40"
                          height="40"
                          alt=""
                        />
                        <FruitImage
                          src={asset("orange")}
                          width="40"
                          height="40"
                          alt=""
                        />
                        <FruitImage
                          src={asset("blueberry")}
                          width="40"
                          height="40"
                          alt=""
                        />
                      </div>
                      <span>
                        Nothing extra.
                        <br />
                        <strong>Just naturally good.</strong>
                      </span>
                    </div>
                  </div>
                  <div
                    className="hero-art"
                    aria-label="Interactive mango composition"
                  >
                    <div className="hero-circle" data-depth="-18" />
                    <span className="hero-ring ring-one" />
                    <span className="hero-ring ring-two" />
                    <span className="hero-caption">
                      THE EVERYDAY / EXTRAORDINARY
                    </span>
                    <div className="hero-background-word" aria-hidden="true">
                      oh,
                      <br />
                      mango!
                    </div>
                    <div className="hero-main-fruit">
                      <FruitImage
                        src={asset("mango")}
                        width="780"
                        height="650"
                        alt="Ripe golden mangoes with a freshly cut mango cheek"
                        data-depth="34"
                        fetchPriority="high"
                      />
                    </div>
                    <FruitImage
                      data-depth="-35"
                      className="hero-satellite satellite-one"
                      src={asset("mango")}
                      width="160"
                      height="140"
                      alt=""
                    />
                    <FruitImage
                      data-depth="48"
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
                        THE SEASON’S GOLDEN CHILD
                        <strong>Alphonso Mangoes</strong>
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
                <Showcase onProduct={showProduct} paused={motionPaused} />
              </>
            )}
            <section
              className="shop section-pad"
              id="shop"
              aria-labelledby="shop-title"
            >
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR DAILY DOSE OF DELICIOUS</span>
                  <h2 id="shop-title">
                    {isShop ? (
                      <>
                        The fresh <em>market.</em>
                      </>
                    ) : (
                      <>Fresh picks. Happy days.</>
                    )}
                  </h2>
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
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
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
                        saved={wishlist.includes(p.id)}
                        onSave={() => toggleSave(p.id)}
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
                <FruitImage
                  className="season-berry"
                  src={asset("strawberry")}
                  width="450"
                  height="400"
                  loading="lazy"
                  alt="Fresh red strawberries"
                />
                <FruitImage
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
                    <FruitImage
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
                  We believe the best things in life don’t need much dressing
                  up. Just sunshine, a little patience, and a lot of care.
                </p>
                <p>
                  Furity is a concept for a simpler, more colorful way to shop
                  seasonal fruit. A small celebration of food that feels as good
                  as it tastes.
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
                    A seasonal approach, with origin information for every fruit
                    in our sample collection.
                  </p>
                </article>
                <article>
                  <CheckCircle2 />
                  <span>02</span>
                  <h3>Only the good stuff.</h3>
                  <p>
                    Freshness and flavor first. Thoughtfully selected fruit,
                    without the unnecessary extras.
                  </p>
                </article>
                <article>
                  <PackageCheck />
                  <span>03</span>
                  <h3>A little care goes a long way.</h3>
                  <p>
                    Our vision: thoughtful packaging that helps every piece
                    arrive ready for its moment.
                  </p>
                </article>
              </div>
            </section>
            <section className="reviews section-pad">
              <span className="eyebrow">
                SOME FEEL-GOOD WORDS · DEMO REVIEWS
              </span>
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
            <MarketExtras />
            <section className="newsletter section-pad">
              <div>
                <span className="eyebrow">A LITTLE GOODNESS IN YOUR INBOX</span>
                <h2>Stay in the fresh.</h2>
                <p>
                  Seasonal stories, fruity ideas, and first dibs on the good
                  stuff.
                </p>
              </div>
              <Newsletter />
            </section>
          </>
        )}
      </main>
      <footer className="footer section-pad">
        <div className="footer-top">
          <a className="logo" href="/">
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
              (t) =>
                t === "Contact us" ? (
                  <a key={t} href="/contact">
                    {t}
                  </a>
                ) : (
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
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
          <a
            href="https://github.com/krishna3251/fruty"
            target="_blank"
            rel="noreferrer"
          >
            Made to grow <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      <PrivacyControls path={route} />
      <MobileShopCTA path={route} blocked={!!overlay || !!detail} />
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
            if (undo) {
              cart.change(undo.id, undo.quantity);
              setUndo(null);
              setNotice("Your fruit is back in the bag.");
            } else {
              setNotice("");
              setOverlay("cart");
            }
          }}
        >
          {undo ? "Undo" : "View bag"} <ArrowRight size={14} />
        </button>
      </motion.div>
      {detail && (
        <Modal title={detail.name} onClose={close}>
          <div className="detail-image" style={{ background: detail.color }}>
            <FruitImage
              src={asset(detail.image)}
              alt={detail.name}
              width="500"
              height="350"
            />
          </div>
          <div className="detail-content">
            <a
              className="text-link full-product-link"
              href={`/products/${detail.id}`}
              onClick={(e) => {
                e.preventDefault();
                close();
                navigate(`/products/${detail.id}`);
              }}
            >
              View full product details <ArrowUpRight size={16} />
            </a>
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
                        <FruitImage
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
                          onClick={() => {
                            setUndo({ id: p.id, quantity: cart.items[p.id] });
                            cart.remove(p.id);
                            setNotice(`${p.name} removed from your bag`);
                          }}
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
        <Modal title="Your fresh checkout" onClose={close}>
          <Checkout
            onBack={() => setOverlay("cart")}
            onComplete={saveReceipt}
          />
        </Modal>
      )}
      {overlay === "wishlist" && (
        <Modal
          title={`Your saved fruit (${wishlist.length})`}
          onClose={close}
          drawer
        >
          {wishlist.length ? (
            <div className="saved-list">
              {products
                .filter((p) => wishlist.includes(p.id))
                .map((p) => (
                  <article key={p.id}>
                    <FruitImage
                      src={asset(p.image)}
                      alt=""
                      width="75"
                      height="75"
                    />
                    <div>
                      <a
                        href={`/products/${p.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          close();
                          navigate(`/products/${p.id}`);
                        }}
                      >
                        {p.name}
                      </a>
                      <span>
                        {money(p.price)} · {p.weight}
                      </span>
                      <button disabled={!p.available} onClick={() => add(p)}>
                        {p.available ? "Add to bag" : "Out of season"}{" "}
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Remove saved ${p.name}`}
                      onClick={() => toggleSave(p.id)}
                    >
                      <X size={17} />
                    </button>
                  </article>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <Heart size={44} strokeWidth={1} />
              <h3>A little love for later.</h3>
              <p>
                Tap a heart on any fruit to keep it here. Your saved list stays
                on this device.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  close();
                  navigate("/shop");
                }}
              >
                Find a favorite <ArrowUpRight size={17} />
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
              Your bag, favorites and sample receipts live on this device.
              Account sign-in is not connected.
            </p>
            {receipts.length > 0 && (
              <div className="receipt-list">
                <span className="eyebrow">YOUR DEMO RECEIPTS</span>
                {receipts.map((r) => (
                  <article key={r.id}>
                    <span>
                      {r.id}
                      <small>
                        {new Date(r.created).toLocaleDateString("en-IN")} ·
                        demo, not a real order
                      </small>
                    </span>
                    <strong>{money(r.total)}</strong>
                  </article>
                ))}
                <button className="text-link" onClick={() => setReceipts([])}>
                  Clear demo history
                </button>
              </div>
            )}
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
      <div className="experience-tools">
        <button
          aria-label={
            motionPaused
              ? "Resume decorative motion"
              : "Pause decorative motion"
          }
          aria-pressed={motionPaused}
          onClick={() => setMotionPaused(!motionPaused)}
        >
          {motionPaused ? <Play size={15} /> : <Pause size={15} />}
          <span>{motionPaused ? "Motion off" : "Motion on"}</span>
        </button>
        <button
          aria-label="Back to top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: reduced ? "instant" : "smooth",
            })
          }
        >
          <ArrowUp size={17} />
        </button>
      </div>
    </div>
  );
}
