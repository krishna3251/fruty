import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Menu,
  Pause,
  Play,
  X,
  UserRound,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useRoute } from "./hooks/useRoute";
import {
  pickleCollections,
  brandAssets,
  retiredPickleRoutes,
} from "./data/pickles";
import { products as archivedFruit, money } from "./data/products";
import { CatalogueProvider, useCatalogue } from "./context/Catalogue";
import {
  PickleSelectionProvider,
  usePickleSelection,
} from "./context/PickleSelection";
import {
  PickleHome,
  PickleCatalogue,
  PickleProductPage,
  TropicalOrdering,
} from "./components/Pickles";
import {
  SessionProvider,
  useSession,
  useFirstVisitLogin,
  rememberGuest,
} from "./context/Session";
import { BusinessProvider, useBusiness } from "./context/Business";
import { enquiryGmail, enquiryWhatsApp } from "./lib/contact";
import CinematicHero from "./components/CinematicHero";
import EnquiryList from "./components/EnquiryList";
import EnquiryReview from "./components/EnquiryReview";
import Modal from "./components/Modal";
import ShoppingConfidence from "./components/ShoppingConfidence";
import { siteConfig } from "./lib/config";
import Newsletter from "./components/Newsletter";
import PageMetadata from "./components/PageMetadata";
import PrivacyControls from "./components/PrivacyControls";
import ServicePolicy from "./components/ServicePolicy";
import InformationPage from "./components/InformationPage";
import MobileShopCTA from "./components/MobileShopCTA";
import { OfflineNotice } from "./components/Resilience";
const AccountPage = lazy(() => import("./components/AccountPage"));
const LegacyFruitStore = lazy(() => import("./LegacyFruitStore"));
function PantryQuestions() {
  const { products } = useCatalogue();
  return (
    <section className="pantry-faq section-pad" id="questions">
      <div>
        <span className="eyebrow">BEFORE YOU PICK YOUR JAR</span>
        <h2>
          Good questions.
          <br />
          <em>Clear answers.</em>
        </h2>
      </div>
      <div>
        {[
          [
            "How do I order?",
            "Add your favourites to the cart, then open WhatsApp or email to send your questions. Enquiries are for Hyderabad. Nothing is sent or ordered automatically.",
          ],
          [
            "Where are the pickles available?",
            "Tropical Feast enquiries are for Hyderabad only. Confirm delivery details and availability before ordering.",
          ],
          [
            "What are the prices and jar sizes?",
            `Current prices: ${products.map((p) => `${p.name}: ₹${p.price ?? "on enquiry"}`).join("; ")}. Each initial flavour is a 200 g jar. Standard delivery is ₹150 per order. Coverage and timing are confirmed on WhatsApp. Confirm availability, ingredients/allergens and final amount before ordering.`,
          ],
          [
            "Which flavours do you offer?",
            `Explore ${products.map((p) => p.name).join(", ")}. These are Tropical Feast products.`,
          ],
          [
            "Can I pay online or choose cash on delivery?",
            "This website prepares an enquiry. Confirm accepted payment methods directly with Tropical Feast on WhatsApp or email before ordering. Online checkout and cash on delivery are not confirmed services.",
          ],
          [
            "When will my jars arrive?",
            "Confirm delivery availability and timing for your Hyderabad location before ordering. We do not show an estimated arrival date until the supplier has confirmed it.",
          ],
          [
            "Do I need an account to shop?",
            "No. Browse and send an enquiry as a guest, or sign in if you would like to use the account features.",
          ],
        ].map(([title, text]) => (
          <details key={title}>
            <summary>
              {title}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{text}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
function PantryShell({ path }: { path: string }) {
  const business = useBusiness();
  const [menu, setMenu] = useState(false);
  const {
    products: pickleProducts,
    loading: catalogueLoading,
    error: catalogueError,
    refresh: refreshCatalogue,
  } = useCatalogue();
  const [listOpen, setListOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const session = useSession();
  const closeAccount = useCallback(() => {
    if (session.status !== "signed-in") rememberGuest();
    setAccountOpen(false);
  }, [session.status]);
  useEffect(() => {
    const open = () => {
      setListOpen(true);
      setCheckoutOpen(false);
      setAccountOpen(false);
    };
    window.addEventListener("pantry:open-cart", open);
    return () => window.removeEventListener("pantry:open-cart", open);
  }, []);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const selection = usePickleSelection()!;
  const checkoutProducts = pickleProducts.filter((p) =>
    selection.ids.includes(p.id),
  );
  const checkoutReady =
    checkoutProducts.length > 0 &&
    checkoutProducts.length === selection.ids.length &&
    checkoutProducts.every(
      (p) =>
        p.price !== null &&
        p.availability !== "unavailable" &&
        p.stockQuantity !== 0 &&
        (p.stockQuantity == null ||
          (selection.quantities[p.id] || 1) <= p.stockQuantity),
    );
  const closeList = useCallback(() => setListOpen(false), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  useEffect(() => {
    setMenu(false);
    setListOpen(false);
    setCheckoutOpen(false);
    setAccountOpen(false);
  }, [path]);
  useFirstVisitLogin(path, setAccountOpen);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  const collection = pickleCollections.find(
    (c) => path === `/collections/${c.id}`,
  );
  const product = pickleProducts.find((p) => path === `/products/${p.id}`);
  const info = ["/privacy", "/terms", "/contact", "/thank-you"].includes(path);
  const catalogue = ["/shop", "/pickles"].includes(path);
  const home = path === "/";
  return (
    <div className={`storefront pantry-store ${paused ? "motion-paused" : ""}`}>
      <PageMetadata path={path} />
      <OfflineNotice />
      <a className="skip-link" href="#pantry-main">
        Skip to content
      </a>
      <div className="pantry-announcement">
        <span>THE TROPICAL FEAST PANTRY</span>
        <span>HYDERABAD · ₹150 STANDARD DELIVERY PER ORDER</span>
      </div>
      <header className="pantry-header">
        <a href="/" className="pantry-logo" aria-label="Tropical Feast home">
          <img
            src={brandAssets.logo}
            alt="Tropical Feast logo"
            width="80"
            height="80"
          />
          <span className="brand-wordmark">
            Tropical Feast<small>HOMEMADE PICKLES · HYDERABAD</small>
          </span>
        </a>
        <nav
          id="pantry-navigation"
          className={`pantry-navigation ${menu ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a
            href="/shop"
            aria-current={catalogue ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            Shop pickles
          </a>
          <a href="/#collections" onClick={() => setMenu(false)}>
            Our flavours
          </a>
          <a href="/#pantry-story" onClick={() => setMenu(false)}>
            Our story
          </a>
          <a
            href="/ordering"
            aria-current={path === "/ordering" ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            How to order
          </a>
          <a href="/contact" onClick={() => setMenu(false)}>
            Contact us
          </a>
        </nav>
        <div className="pantry-tools">
          <button
            className="pantry-account-link"
            onClick={() => {
              setAccountOpen(true);
              setListOpen(false);
              setMenu(false);
            }}
            aria-label="Log in or manage your account"
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            aria-current={
              ["/account", "/sign-in", "/sign-up"].includes(path)
                ? "page"
                : undefined
            }
          >
            <UserRound size={18} />
            <span>{session.status === "signed-in" ? "Account" : "Log in"}</span>
          </button>
          <button
            className="pantry-list-button"
            aria-label={`Open cart, ${selection.itemCount} items`}
            onClick={() => {
              setListOpen(true);
              setAccountOpen(false);
            }}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            <b>{selection.itemCount}</b>
          </button>
          <button
            className="icon-button pantry-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-controls="pantry-navigation"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="pantry-main">
        {catalogueError && (home || path.startsWith("/products/")) && (
          <div className="catalogue-warning" role="status">
            {catalogueError}{" "}
            <button className="text-link" onClick={refreshCatalogue}>
              Try again
            </button>
          </div>
        )}
        {home ? (
          <>
            <CinematicHero paused={paused} />
            <ShoppingConfidence />
            <PickleHome />
            <PantryQuestions />
            {siteConfig.newsletterEndpoint && (
              <section className="newsletter section-pad pantry-newsletter">
                <div>
                  <span className="eyebrow">NOTES FROM THE PANTRY</span>
                  <h2>
                    A little tang
                    <br />
                    <em>in your inbox.</em>
                  </h2>
                  <p>
                    Flavour notes and updates, when newsletter signup is
                    connected.
                  </p>
                </div>
                <Newsletter />
              </section>
            )}
          </>
        ) : ["/account", "/sign-in", "/sign-up", "/admin"].includes(path) ? (
          <Suspense
            fallback={
              <section className="section-pad" role="status">
                Loading account…
              </section>
            }
          >
            <AccountPage
              mode={
                path === "/admin"
                  ? "admin"
                  : path === "/sign-up"
                    ? "sign-up"
                    : path === "/sign-in"
                      ? "sign-in"
                      : "account"
              }
            />
          </Suspense>
        ) : catalogueLoading && path.startsWith("/products/") && !product ? (
          <section className="section-pad" role="status">
            Loading product…
          </section>
        ) : product ? (
          <PickleProductPage product={product} />
        ) : catalogue || collection ? (
          <PickleCatalogue
            key={path}
            collection={collection}
            cataloguePath={path === "/shop" ? "/shop" : "/pickles"}
          />
        ) : path === "/ordering" ? (
          <>
            <section className="pantry-order-intro section-pad">
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <span>/</span>
                <span>How to order</span>
              </nav>
              <span className="eyebrow">ORDERING WITH TROPICAL FEAST</span>
              <h1>
                How to order.
                <br />
                <em>It’s easy.</em>
              </h1>
              <p>
                Choose your favourite jars, review your cart and send us an
                enquiry. We’ll confirm the details with you before ordering.
              </p>
              <ol>
                <li>
                  <strong>Choose your pickles.</strong> Browse the flavours and
                  add your favourites to the cart.
                </li>
                <li>
                  <strong>Review your cart.</strong> Check your jars, quantities
                  and the ₹150 standard delivery charge.
                </li>
                <li>
                  <strong>Send your enquiry.</strong> Open WhatsApp or email
                  from your cart. The seller confirms stock, delivery coverage
                  and payment arrangements.
                </li>
              </ol>
              <div
                className="ordering-flavours"
                aria-label="Available pickle flavours"
              >
                {pickleProducts.map((p) => (
                  <a key={p.id} href={`/products/${p.id}`}>
                    <img
                      src={p.image}
                      alt={p.imageAlt}
                      width="110"
                      height="80"
                    />
                    <span>
                      {p.name}
                      <small>
                        {p.price === null ? "Price on enquiry" : money(p.price)}{" "}
                        · {p.jarSize || "Size to confirm"}
                      </small>
                    </span>
                    <ArrowUpRight size={18} />
                  </a>
                ))}
              </div>
              <button
                className="button primary"
                onClick={() => {
                  setListOpen(true);
                  setAccountOpen(false);
                }}
              >
                Review cart <ArrowRight size={17} />
              </button>
            </section>
            <TropicalOrdering />
            <PantryQuestions />
          </>
        ) : ["/shipping", "/returns"].includes(path) ? (
          <ServicePolicy returns={path === "/returns"} />
        ) : info ? (
          <InformationPage path={path} />
        ) : (
          <section className="pantry-not-found section-pad">
            <span className="pantry-404" aria-hidden="true">
              4
              <img
                src={pickleProducts[1].image}
                alt=""
                width="150"
                height="180"
              />
              4
            </span>
            <span className="eyebrow">A JAR OUT OF PLACE</span>
            <h1>This shelf is empty.</h1>
            <p>
              That page could not be found. Find something tangy in the pickle
              collection.
            </p>
            <a href="/shop" className="button primary">
              Explore pickles <ArrowUpRight size={17} />
            </a>
            <a href="/" className="text-link">
              Return home
            </a>
          </section>
        )}
      </main>
      <footer className="pantry-footer section-pad">
        <div className="pantry-footer-top">
          <div>
            <a className="pantry-logo" href="/">
              <img
                src={brandAssets.logo}
                alt="Tropical Feast logo"
                width="112"
                height="112"
              />
            </a>
            <p>
              A little tang.
              <br />A lot of character.
            </p>
          </div>
          <div>
            <span className="eyebrow">EXPLORE</span>
            <a href="/">Home</a>
            <a href="/shop">All pickles</a>
            <a href="/#pantry-story">Our story</a>
            <a href="/#questions">FAQs</a>
            <a href="/products/tropical-pineapple-pickle">Pineapple Pickle</a>
            <a href="/products/tropical-cucumber-pickle">Cucumber Pickle</a>
          </div>
          <div>
            <span className="eyebrow">CLEAR & SIMPLE</span>
            <a href="/ordering">Ordering information</a>
            <a href="/contact">Contact</a>
            {enquiryWhatsApp(
              undefined,
              `https://wa.me/${business.whatsapp}`,
            ) && (
              <a
                href={enquiryWhatsApp(
                  undefined,
                  `https://wa.me/${business.whatsapp}`,
                )!}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp enquiry
              </a>
            )}
            {enquiryGmail(undefined, business.email) && (
              <a
                href={enquiryGmail(undefined, business.email)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Email enquiry
              </a>
            )}
            <a
              href={business.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram ↗
            </a>
            <a href="/privacy">Privacy & storage</a>
            <a href="/terms">Website terms</a>
            <a href="/shipping">Shipping & delivery</a>
            <a href="/returns">Cancellations & order support</a>
          </div>
          <div>
            <span className="eyebrow">YOUR NEXT JAR</span>
            <button className="text-link" onClick={() => setListOpen(true)}>
              Your cart <ArrowUpRight size={15} />
            </button>
            <a href="/account">Your account</a>
            <a href="/admin">Owner panel</a>
            <p>
              Confirm commercial details
              <br />
              with Tropical Feast.
              <br />
              {business.hours}
            </p>
          </div>
        </div>
        <div className="pantry-footer-bottom">
          <span>© {new Date().getFullYear()} Tropical Feast</span>
          <span>WhatsApp-first · orders confirmed by the business</span>
          <span>Pineapple & cucumber pickles · Hyderabad</span>
        </div>
      </footer>
      <PrivacyControls
        path={path}
        blocked={listOpen || checkoutOpen || accountOpen || menu}
      />
      <MobileShopCTA
        path={path}
        blocked={listOpen || checkoutOpen || accountOpen || path === "/admin"}
      />
      {!reduced && (
        <button
          className="pantry-motion"
          aria-label={paused ? "Resume visual motion" : "Pause visual motion"}
          aria-pressed={paused}
          onClick={() => setPaused((v) => !v)}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          <span>{paused ? "Motion paused" : "Motion on"}</span>
        </button>
      )}
      {accountOpen && (
        <Modal title="Your account" onClose={closeAccount}>
          <div className="login-dialog welcome-dialog">
            <div className="welcome-photo">
              <img
                src={brandAssets.hero}
                alt="Tropical Feast pickle jars"
                width="600"
                height="800"
              />
              <span>
                Rich flavours,
                <br />
                beautifully preserved.
              </span>
            </div>
            <div className="welcome-auth">
              <img
                className="welcome-logo"
                src={brandAssets.logo}
                alt="Tropical Feast"
                width="64"
                height="64"
              />
              <Suspense fallback={<p role="status">Loading sign-in…</p>}>
                <AccountPage mode="account" />
              </Suspense>
              <a className="text-link" href="/sign-up">
                New here? Create an account ↗
              </a>
              <button className="text-link" onClick={closeAccount}>
                Continue browsing as a guest
              </button>
              <p className="account-privacy">
                Sign-in uses essential cookies.{" "}
                <a href="/privacy">Privacy & storage</a>
              </p>
            </div>
          </div>
        </Modal>
      )}
      {listOpen && (
        <Modal title="Your cart" onClose={closeList} drawer>
          <EnquiryList
            onNavigate={closeList}
            onCheckout={() => {
              setListOpen(false);
              setCheckoutOpen(true);
            }}
          />
        </Modal>
      )}
      {checkoutOpen && (
        <Modal title="Checkout details" onClose={closeCheckout}>
          <div className="enquiry-checkout">
            {checkoutReady ? (
              <EnquiryReview
                products={checkoutProducts}
                items={Object.fromEntries(
                  checkoutProducts.map((p) => [
                    p.id,
                    selection.quantities[p.id] || 1,
                  ]),
                )}
                startAtDetails
                onBackToCart={() => {
                  setCheckoutOpen(false);
                  setListOpen(true);
                }}
              />
            ) : (
              <>
                <p>Your cart has changed. Review your items before checkout.</p>
                <button
                  className="text-link"
                  onClick={() => {
                    setCheckoutOpen(false);
                    setListOpen(true);
                  }}
                >
                  Back to cart
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
export default function App() {
  const rawPath = useRoute().replace(/\/$/, "") || "/";
  const path = retiredPickleRoutes[rawPath] || rawPath;
  useEffect(() => {
    if (retiredPickleRoutes[rawPath])
      window.history.replaceState({}, "", retiredPickleRoutes[rawPath]);
  }, [rawPath]);
  const archived =
    ["/fruit-demo", "/fruit-story"].includes(path) ||
    archivedFruit.some((p) => path === `/products/${p.id}`);
  if (archived)
    return (
      <Suspense
        fallback={
          <div className="section-pad" role="status" aria-busy="true">
            Loading archived fruit demo…
          </div>
        }
      >
        <LegacyFruitStore />
      </Suspense>
    );
  return (
    <SessionProvider>
      <BusinessProvider>
        <CatalogueProvider>
          <PickleSelectionProvider>
            <PantryShell path={path} />
          </PickleSelectionProvider>
        </CatalogueProvider>
      </BusinessProvider>
    </SessionProvider>
  );
}
