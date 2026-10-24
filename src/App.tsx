import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Leaf,
  Menu,
  Pause,
  Play,
  X,
  UserRound,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useRoute } from "./hooks/useRoute";
import { usePantryMotion } from "./hooks/usePantryMotion";
import {
  pickleCollections,
  pickleProducts,
  brandAssets,
  retiredPickleRoutes,
} from "./data/pickles";
import { products as archivedFruit } from "./data/products";
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
import { enquiryGmail, enquiryWhatsApp } from "./lib/contact";
import CinematicHero from "./components/CinematicHero";
import EnquiryList from "./components/EnquiryList";
import Modal from "./components/Modal";
import Newsletter from "./components/Newsletter";
import PageMetadata from "./components/PageMetadata";
import PrivacyControls from "./components/PrivacyControls";
import InformationPage from "./components/InformationPage";
import MobileShopCTA from "./components/MobileShopCTA";
import { OfflineNotice } from "./components/Resilience";
const AccountPage = lazy(() => import("./components/AccountPage"));
const LegacyFruitStore = lazy(() => import("./LegacyFruitStore"));
function PantryQuestions() {
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
            "Save your favourites to an enquiry list, then open WhatsApp or email to send your questions. Enquiries are for Hyderabad. Nothing is sent or ordered automatically.",
          ],
          [
            "Where are the pickles available?",
            "Tropical Feast enquiries are for Hyderabad only. Confirm delivery details and availability before ordering.",
          ],
          [
            "What are the prices and jar sizes?",
            "Pineapple Pickle and Cucumber Pickle are ₹200 each. Confirm jar size, availability, ingredients/allergens, delivery charges and the final total before ordering.",
          ],
          [
            "Which flavours do you offer?",
            "There are exactly two flavours: Pineapple Pickle and Cucumber Pickle. Both are Tropical Feast products.",
          ],
          [
            "What images are shown?",
            "The homepage, logo and both product images were supplied by the owner. Product images do not replace an ingredient list; confirm ingredients, allergens, jar size and availability before ordering.",
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
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const selection = usePickleSelection()!;
  const closeList = useCallback(() => setListOpen(false), []);
  usePantryMotion(root, path, paused || !!reduced);
  useEffect(() => {
    setMenu(false);
    setListOpen(false);
  }, [path]);
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
    <div
      ref={root}
      className={`storefront pantry-store ${paused ? "motion-paused" : ""}`}
    >
      <PageMetadata path={path} />
      <OfflineNotice />
      <a className="skip-link" href="#pantry-main">
        Skip to content
      </a>
      {!home && (
        <div className="pantry-announcement">
          <span>THE PICKLE PANTRY</span>
          <span>Two flavours. Pineapple & cucumber.</span>
        </div>
      )}
      <header className="pantry-header">
        <a href="/" className="pantry-logo" aria-label="Fermented Pickles home">
          <img
            src={brandAssets.logo}
            alt="Tropical Feast logo"
            width="80"
            height="80"
          />
          <span className="brand-wordmark">
            Fermented Pickles<small>FEATURING TROPICAL FEAST</small>
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
        </nav>
        <div className="pantry-tools">
          <a
            className="pantry-account-link"
            href="/account"
            aria-label="Your account"
            aria-current={
              ["/account", "/sign-in", "/sign-up"].includes(path)
                ? "page"
                : undefined
            }
          >
            <UserRound size={18} />
            <span>Account</span>
          </a>
          <button
            className="pantry-list-button"
            aria-label={`Open enquiry list, ${selection.itemCount} items`}
            onClick={() => setListOpen(true)}
          >
            <Bookmark size={18} />
            <span>Enquiry list</span>
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
        {home ? (
          <>
            <CinematicHero paused={paused} />
            <div className="pantry-editorial-strip">
              <span>
                <Leaf size={17} /> A fresh perspective on pickles
              </span>
              <i aria-hidden="true">✳</i>
              <span>Pineapple Pickle</span>
              <i aria-hidden="true">✳</i>
              <span>Cucumber Pickle</span>
            </div>
            <PickleHome />
            <section className="pantry-story section-pad" id="pantry-story">
              <span className="eyebrow">THE TROPICAL FEAST STORY</span>
              <h2>
                Good food.
                <br />
                <em>A little more character.</em>
              </h2>
              <p>
                Two pickle flavours, thoughtfully presented: golden pineapple
                and green cucumber. Explore the pair and choose your next jar.
              </p>
              <p>
                Tropical Feast brings both flavours together with the supplied
                crisp, spicy and tangy descriptors. Confirm the product details
                before ordering.
              </p>
              <a href="/shop" className="text-link">
                Explore the pantry <ArrowUpRight size={17} />
              </a>
            </section>
            <PantryQuestions />
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
          </>
        ) : ["/account", "/sign-in", "/sign-up"].includes(path) ? (
          <Suspense
            fallback={
              <section className="section-pad" role="status">
                Loading account…
              </section>
            }
          >
            <AccountPage
              mode={
                path === "/sign-up"
                  ? "sign-up"
                  : path === "/sign-in"
                    ? "sign-in"
                    : "account"
              }
            />
          </Suspense>
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
              <span className="eyebrow">FROM DISCOVERY TO ENQUIRY</span>
              <h1>
                Find your jar.
                <br />
                <em>Ask the right questions.</em>
              </h1>
              <p>
                Choose pineapple, cucumber or both. Save an enquiry list, then
                confirm the details with Tropical Feast before ordering.
              </p>
              <ol>
                <li>
                  <strong>Explore.</strong> Read the flavour and product
                  details.
                </li>
                <li>
                  <strong>Save.</strong> Build a device-local enquiry list.
                </li>
                <li>
                  <strong>Confirm.</strong> Ask about price, size, ingredients,
                  stock and delivery.
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
                      <small>₹200 · Tropical Feast</small>
                    </span>
                    <ArrowUpRight size={18} />
                  </a>
                ))}
              </div>
              <button
                className="button primary"
                onClick={() => setListOpen(true)}
              >
                Review enquiry list <ArrowRight size={17} />
              </button>
            </section>
            <TropicalOrdering />
            <PantryQuestions />
          </>
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
            <a href="/shop">All pickles</a>
            <a href="/products/tropical-pineapple-pickle">Pineapple Pickle</a>
            <a href="/products/tropical-cucumber-pickle">Cucumber Pickle</a>
          </div>
          <div>
            <span className="eyebrow">CLEAR & SIMPLE</span>
            <a href="/ordering">Ordering information</a>
            <a href="/contact">Contact</a>
            {enquiryWhatsApp() && (
              <a
                href={enquiryWhatsApp()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp enquiry
              </a>
            )}
            {enquiryGmail() && (
              <a
                href={enquiryGmail()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Email enquiry
              </a>
            )}
            <a href="/privacy">Privacy & storage</a>
            <a href="/terms">Website terms</a>
          </div>
          <div>
            <span className="eyebrow">YOUR NEXT JAR</span>
            <button className="text-link" onClick={() => setListOpen(true)}>
              Your enquiry list <ArrowUpRight size={15} />
            </button>
            <p>
              Confirm commercial details
              <br />
              with Tropical Feast.
            </p>
          </div>
        </div>
        <div className="pantry-footer-bottom">
          <span>
            © {new Date().getFullYear()} Fermented Pickles · Featuring Tropical
            Feast
          </span>
          <span>
            Enquiry catalogue · no online payments or confirmed orders
          </span>
          <span>Product and brand images supplied by the owner</span>
        </div>
      </footer>
      <PrivacyControls path={path} blocked={listOpen || menu} />
      <MobileShopCTA path={path} blocked={listOpen} />
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
      {listOpen && (
        <Modal title="Your pickle enquiry list" onClose={closeList} drawer>
          <EnquiryList onNavigate={closeList} />
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
    <PickleSelectionProvider>
      <PantryShell path={path} />
    </PickleSelectionProvider>
  );
}
