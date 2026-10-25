import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "Element",
  "Node",
  "localStorage",
  "sessionStorage",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
])
  Object.defineProperty(globalThis, key, {
    value: (dom.window as any)[key],
    configurable: true,
    writable: true,
  });
dom.window.matchMedia = (query: string) => ({
  matches:
    query.includes("prefers-reduced-motion") &&
    !query.includes("no-preference"),
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  writable: true,
  configurable: true,
});
const React = await import("react");
const { render, screen, fireEvent, cleanup, within, waitFor } =
  await import("@testing-library/react");
const { default: App } = await import("../src/LegacyFruitStore.tsx");
const { default: PantryApp } = await import("../src/App.tsx");
const { CartProvider } = await import("../src/context/CartContext.tsx");
const { default: gsap } = await import("gsap");
const { ScrollTrigger } = await import("gsap/ScrollTrigger");
function mount() {
  return render(
    React.createElement(CartProvider, null, React.createElement(App)),
  );
}
test("shop filters, search, bag, quantity, demo checkout and persistence work together", async () => {
  localStorage.clear();
  mount();
  const filters = screen.getByRole("button", { name: "Berries", exact: true });
  fireEvent.click(filters);
  assert.equal(
    screen.getAllByRole("button", { name: /^Add .* to bag$/ }).length,
    2,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show product search" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "Search products" }), {
    target: { value: "no-such-fruit" },
  });
  assert.ok(screen.getByText("No fruit found. Yet."));
  fireEvent.click(screen.getByRole("button", { name: "Show all fruit" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Add Alphonso Mangoes to bag" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bag, 1 items" }));
  let dialog = screen.getByRole("dialog");
  fireEvent.click(
    within(dialog).getByRole("button", {
      name: "Increase Alphonso Mangoes quantity",
    }),
  );
  assert.equal(
    within(dialog).getByLabelText("Alphonso Mangoes quantity").textContent,
    "2",
  );
  assert.equal(JSON.parse(localStorage.getItem("furity-cart-v1")!).mango, 2);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Continue to demo checkout" }),
  );
  dialog = screen.getByRole("dialog");

  fireEvent.click(
    within(dialog).getByRole("button", { name: "Use sample details" }),
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Review your harvest" }),
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Finish demo checkout" }),
  );
  await screen.findByText("Demo complete!");
  assert.ok(screen.getByText("Demo complete!"));
  assert.ok(
    screen.getByText(
      "No order was placed, no payment was taken, and your bag is still here.",
    ),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  assert.ok(
    screen.queryByRole("dialog") === null,
    "Browsing closes the drawer",
  );
  cleanup();
  mount();
  assert.ok(screen.getByRole("button", { name: "Open bag, 2 items" }));
  fireEvent.click(screen.getByRole("button", { name: "Open bag, 2 items" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Remove Alphonso Mangoes",
    }),
  );
  assert.ok(screen.getByText("A lot of possibility.", { exact: false }));
  cleanup();
});
test("out-of-season product cannot be purchased, newsletter stays a demo, dialogs trap focus", () => {
  localStorage.clear();
  mount();
  assert.ok(
    (
      screen.getByRole("button", {
        name: "Add Creamy Avocados to bag",
      }) as HTMLButtonElement
    ).disabled,
  );
  fireEvent.click(screen.getByRole("button", { name: "View Creamy Avocados" }));
  let dialog = screen.getByRole("dialog");
  assert.ok(
    (
      within(dialog).getByRole("button", {
        name: "Out of season",
      }) as HTMLButtonElement
    ).disabled,
  );
  fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Your email address" }),
    { target: { value: "demo@example.test" } },
  );
  fireEvent.submit(
    screen
      .getByRole("textbox", { name: "Your email address" })
      .closest("form")!,
  );
  assert.ok(
    screen.getByText(
      "Newsletter signup is not available yet. Your email has not been submitted.",
    ),
  );
  assert.equal(localStorage.getItem("furity-cart-v1"), "{}");
  const account = screen.getByRole("button", { name: "Your account" });
  account.focus();
  fireEvent.click(account);
  dialog = screen.getByRole("dialog");
  const last = within(dialog).getByRole("button", { name: "Open your bag" });
  last.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  assert.equal(
    document.activeElement,
    within(dialog).getByRole("button", { name: "Close dialog" }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(document.activeElement, account);
  cleanup();
});

test("saved fruit, deep product pages and unknown routes have usable recovery", () => {
  localStorage.clear();
  mount();
  fireEvent.click(
    screen.getByRole("button", { name: "Save Alphonso Mangoes" }),
  );
  assert.deepEqual(JSON.parse(localStorage.getItem("furity-saved-v1")!), [
    "mango",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Saved fruit, 1 items" }));
  let dialog = screen.getByRole("dialog");
  assert.ok(within(dialog).getByText("Alphonso Mangoes"));
  fireEvent.click(
    within(dialog).getByRole("link", { name: "Alphonso Mangoes" }),
  );
  assert.equal(window.location.pathname, "/products/mango");
  assert.ok(
    screen.getByRole("heading", { name: "Alphonso Mangoes", level: 1 }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Increase selected packs" }),
  );
  assert.equal(screen.getByLabelText("Selected packs").textContent, "2");
  fireEvent.click(screen.getByRole("button", { name: "Add to your bag" }));
  assert.ok(screen.getByRole("button", { name: "Open bag, 2 items" }));
  fireEvent.click(screen.getByRole("tab", { name: "Keep it fresh" }));
  assert.ok(
    screen
      .getByRole("tabpanel")
      .textContent?.includes("Ripen at room temperature"),
  );
  React.act(() => {
    window.history.pushState({}, "", "/missing-fruit");
    window.dispatchEvent(new window.PopStateEvent("popstate"));
  });
  assert.ok(screen.getByRole("heading", { name: /A little lost/ }));
  cleanup();
  window.history.replaceState({}, "", "/");
});
test("checkout surfaces field errors, accepts sample details, validates coupons and stores no contact data", async () => {
  localStorage.clear();
  mount();
  fireEvent.click(
    screen.getByRole("button", { name: "Add Alphonso Mangoes to bag" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bag, 1 items" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Continue to demo checkout" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Review your harvest" }));
  assert.equal(screen.getAllByRole("alert").length, 6);
  assert.ok(screen.getByText("Enter a valid 6-digit Indian PIN code."));
  fireEvent.click(screen.getByRole("button", { name: "Use sample details" }));
  fireEvent.click(screen.getByRole("button", { name: "Review your harvest" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Promo code" }), {
    target: { value: "INVALID" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  assert.ok(screen.getByText(/That code isn’t valid/));
  fireEvent.change(screen.getByRole("textbox", { name: "Promo code" }), {
    target: { value: "fresh10" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  assert.ok(screen.getByText("FRESH10 applied: 10% off, up to ₹150."));
  fireEvent.click(screen.getByRole("button", { name: "Finish demo checkout" }));
  await screen.findByText("Demo complete!");
  const receipts = JSON.parse(localStorage.getItem("furity-receipts-v1")!);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].total, 633);
  assert.ok(!JSON.stringify(receipts).includes("example.test"));
  assert.ok(!JSON.stringify(receipts).includes("Sample Garden"));
  cleanup();
});
test("image failures and offline events give useful feedback", () => {
  localStorage.clear();
  mount();
  fireEvent.error(
    screen.getByAltText("Ripe golden mangoes with a freshly cut mango cheek"),
  );
  assert.ok(screen.getAllByText("Fresh image on its way").length > 0);
  Object.defineProperty(navigator, "onLine", {
    value: false,
    configurable: true,
  });
  fireEvent(window, new window.Event("offline"));
  assert.ok(
    screen.getByText(
      "You’re offline. Loaded products and your saved lists still work.",
    ),
  );
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
  fireEvent(window, new window.Event("online"));
  assert.equal(
    screen.queryByText(
      "You’re offline. Loaded products and your saved lists still work.",
    ),
    null,
  );
  cleanup();
});

test("optional analytics is blocked before consent, deduplicates pages and stops on revocation", async () => {
  cleanup();
  localStorage.clear();
  const { siteConfig } = await import("../src/lib/config.ts");
  const { default: PrivacyControls } =
    await import("../src/components/PrivacyControls.tsx");
  const analytics = await import("../src/lib/analytics.ts");
  const previous = siteConfig.analyticsId;
  siteConfig.analyticsId = "G-UNITTEST1";
  const view = render(React.createElement(PrivacyControls, { path: "/shop" }));
  assert.equal(document.getElementById("furity-analytics"), null);
  fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
  assert.equal(document.getElementById("furity-analytics"), null);
  assert.equal(analytics.readConsent()?.analytics, false);
  cleanup();
  localStorage.clear();
  const accepted = render(
    React.createElement(PrivacyControls, { path: "/shop" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Accept analytics" }));
  assert.equal(document.querySelectorAll("#furity-analytics").length, 1);
  const w = window as any;
  const count = () =>
    w.dataLayer.filter(
      (entry: any) => entry[0] === "event" && entry[1] === "page_view",
    ).length;
  const before = count();
  accepted.rerender(React.createElement(PrivacyControls, { path: "/shop" }));
  assert.equal(count(), before);
  accepted.rerender(
    React.createElement(PrivacyControls, { path: "/products/mango" }),
  );
  assert.equal(count(), before + 1);
  assert.equal(document.querySelectorAll("#furity-analytics").length, 1);
  analytics.stopAnalytics();
  assert.equal(document.getElementById("furity-analytics"), null);
  assert.equal(
    analytics.trackPage("/contact", "https://fruty-fawn.vercel.app"),
    false,
  );
  cleanup();
  siteConfig.analyticsId = previous;
  localStorage.clear();
});
test("newsletter preserves input on service failure and confirms only a verified response", async () => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  const { siteConfig } = await import("../src/lib/config.ts");
  const { default: Newsletter } =
    await import("../src/components/Newsletter.tsx");
  const { default: InformationPage } =
    await import("../src/components/InformationPage.tsx");
  const endpoint = siteConfig.newsletterEndpoint;
  const previous = globalThis.fetch;
  siteConfig.newsletterEndpoint = "https://newsletter.example.test/subscribe";
  globalThis.fetch = async () =>
    ({ ok: false, json: async () => ({ subscribed: false }) }) as Response;
  render(React.createElement(Newsletter));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Your email address" }),
    { target: { value: "buyer@example.test" } },
  );
  fireEvent.submit(
    screen
      .getByRole("textbox", { name: "Your email address" })
      .closest("form")!,
  );
  await screen.findByText(/We couldn’t confirm your signup/);
  assert.equal(
    (
      screen.getByRole("textbox", {
        name: "Your email address",
      }) as HTMLInputElement
    ).value,
    "buyer@example.test",
  );
  assert.equal(sessionStorage.getItem("furity-newsletter-confirmed"), null);
  globalThis.fetch = async () =>
    ({ ok: true, json: async () => ({ subscribed: true }) }) as Response;
  fireEvent.submit(
    screen
      .getByRole("textbox", { name: "Your email address" })
      .closest("form")!,
  );
  await screen.findByText(
    "Subscribe for seasonal updates. Read our privacy notice before submitting.",
  );
  await waitFor(() =>
    assert.ok(sessionStorage.getItem("furity-newsletter-confirmed")),
  );
  cleanup();
  render(React.createElement(InformationPage, { path: "/thank-you" }));
  assert.ok(screen.getByRole("heading", { name: "Thanks for subscribing." }));
  cleanup();
  sessionStorage.clear();
  render(React.createElement(InformationPage, { path: "/thank-you" }));
  assert.ok(screen.getByRole("heading", { name: "No signup to confirm." }));
  cleanup();
  globalThis.fetch = previous;
  siteConfig.newsletterEndpoint = endpoint;
  window.history.replaceState({}, "", "/");
});

test("dedicated policy/contact routes exist, confirmation is guarded, and mobile CTA adapts to visibility", async () => {
  const { default: MobileShopCTA } =
    await import("../src/components/MobileShopCTA.tsx");
  localStorage.clear();
  cleanup();
  window.history.replaceState({}, "", "/privacy/");
  mount();
  assert.ok(screen.getByRole("heading", { name: "Privacy & storage." }));
  assert.equal(
    document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    "https://fruty-fawn.vercel.app/privacy",
  );
  cleanup();
  window.history.replaceState({}, "", "/contact");
  mount();
  assert.ok(
    screen.getByText("Not provided — no business address is published"),
  );
  assert.equal(screen.queryByRole("link", { name: /@/ }), null);
  cleanup();
  window.history.replaceState({}, "", "/");
  let callback: any;
  const mock = class {
    constructor(cb: any) {
      callback = cb;
    }
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: mock,
    configurable: true,
  });
  const hero = document.createElement("div");
  hero.className = "hero-copy";
  hero.innerHTML = '<a class="button" href="#shop">Main CTA</a>';
  const shop = document.createElement("section");
  shop.id = "shop";
  document.body.append(hero, shop);
  render(React.createElement(MobileShopCTA, { path: "/", blocked: false }));
  React.act(() =>
    callback([
      { target: hero.querySelector("a"), isIntersecting: false },
      { target: shop, isIntersecting: false },
    ]),
  );
  assert.ok(screen.getByRole("link", { name: "Explore pickles" }));
  React.act(() => callback([{ target: shop, isIntersecting: true }]));
  assert.equal(screen.queryByRole("link", { name: "Explore pickles" }), null);
  cleanup();
  hero.remove();
  shop.remove();
  delete (globalThis as any).IntersectionObserver;
});

test("pickle catalogue filters by collection, searches both flavours and recovers from empty results", async () => {
  window.history.replaceState({}, "", "/pickles");
  localStorage.clear();
  mount();
  const main = within(screen.getByRole("main"));
  assert.equal(main.getAllByRole("article").length, 2);
  fireEvent.change(main.getByRole("searchbox", { name: "Search pickles" }), {
    target: { value: "cucumber" },
  });
  assert.equal(main.getAllByRole("article").length, 1);
  fireEvent.click(
    main.getByRole("button", { name: "Cucumber Pickle", exact: true }),
  );
  assert.equal(main.getAllByRole("article").length, 1);
  assert.match(
    main.getAllByRole("article")[0].textContent || "",
    /Tropical Feast/,
  );
  fireEvent.change(main.getByRole("searchbox", { name: "Search pickles" }), {
    target: { value: "not-a-pickle" },
  });
  assert.ok(main.getByText("No pickles found."));
  fireEvent.click(main.getByRole("button", { name: "Reset search" }));
  assert.equal(main.getAllByRole("article").length, 2);
  fireEvent.click(
    main.getByRole("link", { name: "Pineapple Pickle", exact: true }),
  );
  await waitFor(() =>
    assert.ok(
      main.getByRole("heading", { level: 1, name: "Pineapple Pickle" }),
    ),
  );
  assert.equal(window.location.pathname, "/products/tropical-pineapple-pickle");
  assert.ok(main.getAllByText("Hyderabad only").length > 0);
  assert.equal(main.queryByRole("button", { name: /add.*bag/i }), null);
  assert.ok(main.getByRole("link", { name: "WhatsApp enquiry" }));
  assert.ok(main.getByRole("link", { name: "Email enquiry" }));
  cleanup();
  window.history.replaceState({}, "", "/");
});
test("all pickle routes render, preserve null commercial fields and scope Hyderabad to Tropical Feast", async () => {
  const { pickleProducts, pickleCollections } =
    await import("../src/data/pickles.ts");
  for (const p of pickleProducts) {
    window.history.replaceState({}, "", `/products/${p.id}/`);
    mount();
    const main = within(screen.getByRole("main"));
    assert.ok(main.getByRole("heading", { level: 1, name: p.name }));
    assert.ok(main.getByText("Not supplied — confirm before ordering"));
    assert.equal(
      main.queryAllByText("Hyderabad only").length > 0,
      p.collectionId === "tropical-feast",
    );
    assert.equal(main.queryByRole("button", { name: /add.*bag/i }), null);
    cleanup();
  }
  for (const c of pickleCollections) {
    window.history.replaceState({}, "", `/collections/${c.id}`);
    mount();
    const main = within(screen.getByRole("main"));
    assert.ok(
      main.getByRole("heading", { level: 1, name: "The Tropical Feast pair." }),
    );
    assert.equal(main.getAllByRole("article").length, 2);
    assert.equal(
      main.queryByRole("heading", { name: "Available in Hyderabad." }) !== null,
      c.id === "tropical-feast",
    );
    cleanup();
  }
  window.history.replaceState({}, "", "/");
});
test("Tropical Feast DM is only enabled for its explicit safe configuration", async () => {
  const { siteConfig } = await import("../src/lib/config.ts");
  const { TropicalOrdering } = await import("../src/components/Pickles.tsx");
  const old = siteConfig.tropicalFeastDmUrl;
  try {
    siteConfig.tropicalFeastDmUrl = "javascript:alert(1)";
    render(React.createElement(TropicalOrdering));
    assert.equal(
      screen.queryByRole("link", { name: "WhatsApp enquiry" }),
      null,
    );
    cleanup();
    siteConfig.tropicalFeastDmUrl = "https://dm.example.test/verified-supplier";
    render(React.createElement(TropicalOrdering));
    const link = screen.getByRole("link", { name: "WhatsApp enquiry" });
    assert.equal(link.getAttribute("href"), siteConfig.tropicalFeastDmUrl);
    assert.equal(link.getAttribute("target"), "_blank");
    assert.match(link.getAttribute("rel") || "", /noopener/);
    cleanup();
  } finally {
    siteConfig.tropicalFeastDmUrl = old;
  }
});

function mountPantry() {
  return render(
    React.createElement(CartProvider, null, React.createElement(PantryApp)),
  );
}
test("primary homepage and shop are pickle-only, with enquiry controls and persistent two-flavour selection", async () => {
  window.history.replaceState({}, "", "/");
  localStorage.clear();
  mountPantry();
  const main = within(screen.getByRole("main"));
  assert.equal(document.querySelectorAll(".product-card").length, 0);
  assert.equal(main.queryByText("Freshness,", { exact: false }), null);
  assert.ok(screen.getByRole("link", { name: "Shop pickles", exact: true }));
  assert.equal(screen.queryByRole("button", { name: "Search fruit" }), null);
  fireEvent.click(
    screen.getByRole("link", { name: "Shop pickles", exact: true }),
  );
  await waitFor(() =>
    assert.ok(
      screen.getByRole("heading", { name: "The pickle pantry.", exact: true }),
    ),
  );
  assert.equal(window.location.pathname, "/shop");
  assert.equal(
    within(screen.getByRole("main")).getAllByRole("article").length,
    2,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Add to cart: Cucumber Pickle",
      exact: true,
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Add to cart: Pineapple Pickle",
      exact: true,
    }),
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem("fruity-pickle-selection-v1")!),
    ["tropical-cucumber-pickle", "tropical-pineapple-pickle"],
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open cart, 2 items",
      exact: true,
    }),
  );
  const dialog = within(screen.getByRole("dialog"));
  assert.ok(
    dialog.getByRole("heading", { name: "Tropical Feast", exact: true }),
  );
  fireEvent.click(dialog.getByText("Preview or copy your enquiry"));
  assert.match(
    dialog.getByRole("textbox", { name: "Your enquiry draft" }).textContent ||
      "",
    /Pineapple Pickle — Tropical Feast/,
  );
  assert.equal(dialog.queryByRole("button", { name: /checkout/i }), null);
  const previousClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard",
  );
  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    fireEvent.click(dialog.getByRole("button", { name: "Copy enquiry draft" }));
    await waitFor(() => assert.ok(dialog.getByText(/Copy is unavailable/)));
    let copied = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          copied = value;
        },
      },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Copy enquiry draft" }));
    await waitFor(() => assert.ok(dialog.getByText(/Enquiry draft copied/)));
    assert.match(copied, /confirm jar sizes, ingredients/);
  } finally {
    if (previousClipboard)
      Object.defineProperty(navigator, "clipboard", previousClipboard);
    else Reflect.deleteProperty(navigator, "clipboard");
  }
  fireEvent.click(
    dialog.getByRole("button", {
      name: "Remove Cucumber Pickle — Tropical Feast from enquiry list",
    }),
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem("fruity-pickle-selection-v1")!),
    ["tropical-pineapple-pickle"],
  );
  fireEvent.keyDown(document, { key: "Escape" });
  cleanup();
  mountPantry();
  assert.ok(
    screen.getByRole("button", {
      name: "Open cart, 1 items",
      exact: true,
    }),
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});
test("primary ordering and missing routes offer useful recovery without fruit navigation or fake checkout", async () => {
  window.history.replaceState({}, "", "/ordering");
  mountPantry();
  assert.ok(
    screen.getByRole("heading", {
      name: /Find your jar.*Ask the right questions/,
      exact: false,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Review cart" }));
  assert.ok(screen.getByRole("dialog"));
  cleanup();
  window.history.replaceState({}, "", "/does-not-exist");
  mountPantry();
  assert.ok(screen.getByRole("heading", { name: "This shelf is empty." }));
  assert.ok(screen.getByRole("link", { name: "Explore pickles", exact: true }));
  assert.equal(
    document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    "noindex,follow",
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});
test("primary product details save priced pickles while archived fruit cart remains separately usable", async () => {
  localStorage.clear();
  window.history.replaceState({}, "", "/products/tropical-pineapple-pickle");
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Add to cart: Pineapple Pickle",
      exact: true,
    }),
  );
  assert.ok(
    screen.getByRole("button", {
      name: "View cart for Pineapple Pickle",
      exact: true,
    }),
  );
  assert.equal(screen.queryByRole("button", { name: /add.*bag/i }), null);
  assert.ok(screen.getAllByText("Hyderabad only").length > 0);
  cleanup();
  window.history.replaceState({}, "", "/fruit-demo");
  mountPantry();
  await screen.findByRole("button", {
    name: "Add Alphonso Mangoes to bag",
    exact: true,
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Add Alphonso Mangoes to bag",
      exact: true,
    }),
  );
  assert.equal(JSON.parse(localStorage.getItem("furity-cart-v1")!).mango, 1);
  assert.equal(
    JSON.parse(localStorage.getItem("fruity-pickle-selection-v1")!).length,
    1,
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});

test("cinematic hero keeps a single local video, supports manual seeking and recovers from loading failures", async () => {
  window.history.replaceState({}, "", "/");
  const originalTimer = window.setTimeout;
  const originalLoad = window.HTMLMediaElement.prototype.load;
  let loadingTimeout: (() => void) | undefined;
  window.setTimeout = ((handler: TimerHandler, delay?: number) => {
    if (delay === 8000 && typeof handler === "function") {
      loadingTimeout = handler as () => void;
      return 0;
    }
    return originalTimer(handler, delay);
  }) as typeof window.setTimeout;
  let reloads = 0;
  window.HTMLMediaElement.prototype.load = () => {
    reloads++;
  };
  try {
    mountPantry();
    const media = document.querySelector<HTMLVideoElement>(".cinema-video")!;
    assert.equal(document.querySelectorAll("video").length, 1);
    assert.equal(media.getAttribute("src"), "/videos/pineapple-pickle.mp4");
    assert.equal(
      media.getAttribute("poster"),
      "/videos/pineapple-pickle-poster.webp",
    );
    assert.equal(media.autoplay, false);
    assert.equal(media.muted, true);
    assert.equal(media.controls, true);
    assert.equal(media.preload, "none");
    fireEvent.click(
      screen.getByRole("button", { name: "The golden fill", exact: true }),
    );
    assert.equal(reloads, 1);
    assert.equal(media.preload, "auto");
    assert.equal(
      document.querySelector(".cinema-hero")?.getAttribute("data-mode"),
      "manual",
    );
    Object.defineProperty(media, "readyState", {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(media, "duration", { configurable: true, value: 10 });
    fireEvent.loadedMetadata(media);
    fireEvent.change(
      screen.getByRole("slider", { name: "Explore the jar sequence" }),
      { target: { value: "94" } },
    );
    await waitFor(() => assert.ok(media.currentTime > 9.9));
    fireEvent.change(
      screen.getByRole("slider", { name: "Explore the jar sequence" }),
      { target: { value: "20" } },
    );
    await waitFor(() => assert.ok(media.currentTime < 2));
    fireEvent.error(media);
    assert.ok(screen.getByText(/The film couldn’t load/));
    assert.ok(screen.getByRole("button", { name: "Retry film" }));
    fireEvent.click(screen.getByRole("button", { name: "Retry film" }));
    assert.equal(reloads, 2);
    assert.equal(document.querySelectorAll("video").length, 1);
    assert.ok(loadingTimeout);
    cleanup();
  } finally {
    cleanup();
    window.setTimeout = originalTimer;
    window.HTMLMediaElement.prototype.load = originalLoad;
  }
});

test("slow desktop media keeps its matching poster and can switch to unpinned manual controls", async () => {
  const { default: CinematicHero } =
    await import("../src/components/CinematicHero.tsx");
  const originalMedia = window.matchMedia;
  const originalTimer = window.setTimeout;
  const proto = window.HTMLMediaElement.prototype;
  const originalPlay = proto.play;
  proto.play = () => Promise.resolve();
  let loadingTimeout: (() => void) | undefined;
  window.matchMedia = (query) => ({ ...originalMedia(query), matches: false });
  window.setTimeout = ((handler: TimerHandler, delay?: number) => {
    if (delay === 8000 && typeof handler === "function") {
      loadingTimeout = handler as () => void;
      return 0;
    }
    return originalTimer(handler, delay);
  }) as typeof window.setTimeout;
  try {
    render(React.createElement(CinematicHero));
    assert.ok(screen.getByText("Preparing your jar story…"));
    assert.ok(document.querySelector(".cinema-loading-poster"));
    await React.act(async () => {
      loadingTimeout?.();
    });
    assert.ok(screen.getByText(/The film is taking a little longer/));
    assert.ok(document.querySelector(".cinema-loading-poster"));
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Use video controls",
        exact: true,
      })[0],
    );
    assert.equal(
      document.querySelector(".cinema-hero")?.getAttribute("data-mode"),
      "manual",
    );
    assert.equal(
      document.querySelector<HTMLVideoElement>("video")?.controls,
      true,
    );
    assert.equal(document.querySelector(".cinema-loading-poster"), null);
    cleanup();
  } finally {
    cleanup();
    window.matchMedia = originalMedia;
    window.setTimeout = originalTimer;
    proto.play = originalPlay;
  }
});

test("inline hero autoplays muted without pinning and supports pause and play", async () => {
  const { default: CinematicHero } =
    await import("../src/components/CinematicHero.tsx");
  const originalMedia = window.matchMedia;
  const proto = window.HTMLMediaElement.prototype;
  const originalPlay = proto.play,
    originalPause = proto.pause;
  const pausedDescriptor = Object.getOwnPropertyDescriptor(proto, "paused")!;
  const playing = new WeakSet<HTMLMediaElement>();
  window.matchMedia = (query) => ({
    ...originalMedia(query),
    matches: false,
  });
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get() {
      return !playing.has(this);
    },
  });
  proto.play = function () {
    playing.add(this);
    this.dispatchEvent(new window.Event("play"));
    return Promise.resolve();
  };
  proto.pause = function () {
    playing.delete(this);
    this.dispatchEvent(new window.Event("pause"));
  };
  try {
    render(React.createElement(CinematicHero));
    const media = document.querySelector<HTMLVideoElement>("video")!;
    assert.equal(media.autoplay, true);
    assert.equal(media.muted, true);
    assert.equal(media.controls, false);
    assert.equal(
      document.querySelector(".cinema-hero")?.getAttribute("data-mode"),
      "autoplay",
    );
    assert.equal(document.querySelectorAll(".cinema-loading-poster").length, 1);
    fireEvent.loadedData(media);
    assert.equal(document.querySelectorAll(".cinema-loading-poster").length, 0);
    fireEvent.click(screen.getByRole("button", { name: "Pause product film" }));
    assert.equal(media.paused, true);
    fireEvent.click(screen.getByRole("button", { name: "Play product film" }));
    await waitFor(() => assert.equal(media.paused, false));
    cleanup();
    assert.equal(media.paused, true);
  } finally {
    cleanup();
    window.matchMedia = originalMedia;
    proto.play = originalPlay;
    proto.pause = originalPause;
    Object.defineProperty(proto, "paused", pausedDescriptor);
  }
});
test("contact buttons expose destinations only in links and both pickle details show the owner price", () => {
  for (const path of [
    "/",
    "/contact",
    "/privacy",
    "/products/tropical-pineapple-pickle",
    "/products/tropical-cucumber-pickle",
  ]) {
    window.history.replaceState({}, "", path);
    mountPantry();
    assert.doesNotMatch(
      document.body.textContent || "",
      /krishnasoni3251@gmail\.com|9398152226/,
    );
    if (path.startsWith("/products/")) {
      const main = within(screen.getByRole("main"));
      assert.ok(main.getAllByText(/₹200/).length);
      assert.match(
        main
          .getByRole("link", { name: "WhatsApp enquiry" })
          .getAttribute("href")!,
        /^https:\/\/wa\.me\/919398152226\?text=/,
      );
      assert.match(
        main.getByRole("link", { name: "Email enquiry" }).getAttribute("href")!,
        /^https:\/\/mail\.google\.com\/mail\/\?/,
      );
    }
    cleanup();
  }
  window.history.replaceState({}, "", "/");
});

test("enquiry basket quantities, subtotal and both email routes persist and stay in sync", async () => {
  localStorage.clear();
  window.history.replaceState({}, "", "/shop");
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Add to cart: Pineapple Pickle",
      exact: true,
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open cart, 1 items",
      exact: true,
    }),
  );
  let dialog = within(screen.getByRole("dialog"));
  fireEvent.click(
    dialog.getByRole("button", { name: "Increase Pineapple Pickle quantity" }),
  );
  assert.equal(
    dialog.getByLabelText("Pineapple Pickle quantity").textContent,
    "2",
  );
  assert.ok(dialog.getByText("₹400"));
  const gmail = dialog.getByRole("link", { name: "Email", exact: true });
  assert.equal(dialog.getAllByRole("img").length, 1);
  assert.ok(dialog.getByRole("link", { name: "WhatsApp", exact: true }));
  const web = new URL(gmail.getAttribute("href")!);
  assert.equal(web.origin, "https://mail.google.com");
  assert.match(web.searchParams.get("body")!, /2 × Pineapple Pickle/);
  assert.match(web.searchParams.get("body")!, /Products subtotal: ₹400/);
  assert.match(web.searchParams.get("body")!, /Delivery: ₹150/);
  assert.match(web.searchParams.get("body")!, /Total: ₹550/);
  assert.ok(dialog.getByText("₹550"));
  assert.equal(gmail.getAttribute("target"), "_blank");
  fireEvent.click(dialog.getByText("Preview or copy your enquiry"));
  assert.match(
    dialog
      .getByRole("link", { name: "Use my email app instead" })
      .getAttribute("href")!,
    /^mailto:/,
  );
  assert.equal(
    JSON.parse(localStorage.getItem("fruity-pickle-quantities-v1")!)[
      "tropical-pineapple-pickle"
    ],
    2,
  );
  cleanup();
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open cart, 2 items",
      exact: true,
    }),
  );
  dialog = within(screen.getByRole("dialog"));
  assert.equal(
    dialog.getByLabelText("Pineapple Pickle quantity").textContent,
    "2",
  );
  fireEvent.click(
    dialog.getByRole("button", { name: "Decrease Pineapple Pickle quantity" }),
  );
  assert.equal(
    dialog.getByLabelText("Pineapple Pickle quantity").textContent,
    "1",
  );
  assert.equal(
    (
      dialog.getByRole("button", {
        name: "Decrease Pineapple Pickle quantity",
      }) as HTMLButtonElement
    ).disabled,
    true,
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});
test("SPA metadata replaces product structured data after navigating to contact", () => {
  window.history.replaceState({}, "", "/products/tropical-cucumber-pickle");
  mountPantry();
  assert.equal(document.querySelectorAll("#page-structured-data").length, 1);
  assert.match(
    document.getElementById("page-structured-data")!.textContent!,
    /"Product"/,
  );
  fireEvent.click(screen.getByRole("link", { name: "Contact", exact: true }));
  assert.equal(document.querySelectorAll("#page-structured-data").length, 1);
  assert.doesNotMatch(
    document.getElementById("page-structured-data")!.textContent!,
    /"Product"/,
  );
  assert.equal(
    document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    "https://fruty-fawn.vercel.app/contact",
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});

test.after(() => {
  cleanup();
  ScrollTrigger.killAll();
  ScrollTrigger.disable(true);
  gsap.ticker.sleep();
  dom.window.close();
});

test("empty enquiry basket offers both pictured products and closes when browsing the current shop route", () => {
  localStorage.clear();
  window.history.replaceState({}, "", "/shop");
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open cart, 0 items",
      exact: true,
    }),
  );
  let dialog = within(screen.getByRole("dialog"));
  assert.equal(dialog.getAllByRole("img").length, 2);
  fireEvent.click(dialog.getByRole("link", { name: "Explore pickles" }));
  assert.ok(
    screen.queryByRole("dialog") === null,
    "Browsing closes the drawer",
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open cart, 0 items",
      exact: true,
    }),
  );
  dialog = within(screen.getByRole("dialog"));
  fireEvent.click(
    dialog.getByRole("button", {
      name: "Add to cart: Pineapple Pickle",
    }),
  );
  assert.ok(dialog.getByRole("link", { name: "Email", exact: true }));
  assert.ok(dialog.getByRole("link", { name: "WhatsApp", exact: true }));
  assert.equal(dialog.getAllByText("₹200", { selector: "strong" }).length, 2);
  assert.equal(
    document.querySelector<HTMLDetailsElement>(".basket-draft-details")?.open,
    false,
  );
  cleanup();
});

test("account navigation and unavailable-provider state stay honest without blocking guest shopping", async () => {
  window.history.replaceState({}, "", "/shop");
  mountPantry();
  fireEvent.click(
    screen.getByRole("link", { name: "Your account", exact: true }),
  );
  await waitFor(() =>
    assert.ok(screen.getByText("Accounts aren’t available here yet.")),
  );
  assert.equal(window.location.pathname, "/account");
  assert.equal(screen.queryByRole("textbox", { name: /password/i }), null);
  assert.ok(screen.getByRole("link", { name: "Explore pickles", exact: true }));
  assert.ok(document.body.textContent?.includes("essential session cookies"));
  cleanup();
  window.history.replaceState({}, "", "/");
});

test("essential-cookie notice is honest, remembers acknowledgement, and stays clear of account forms and drawers", async () => {
  const { default: PrivacyControls } =
    await import("../src/components/PrivacyControls.tsx");
  const { siteConfig } = await import("../src/lib/config.ts");
  const analytics = await import("../src/lib/analytics.ts");
  const previous = siteConfig.analyticsId;
  siteConfig.analyticsId = "";
  localStorage.clear();
  const view = render(React.createElement(PrivacyControls, { path: "/shop" }));
  assert.ok(
    screen.getByRole("region", { name: "Cookies and essential storage" }),
  );
  assert.equal(
    screen.queryByRole("button", { name: "Accept analytics" }),
    null,
  );
  view.rerender(
    React.createElement(PrivacyControls, { path: "/shop", blocked: true }),
  );
  assert.equal(
    screen.queryByRole("region", { name: "Cookies and essential storage" }),
    null,
  );
  view.rerender(React.createElement(PrivacyControls, { path: "/sign-in" }));
  assert.equal(
    screen.queryByRole("region", { name: "Cookies and essential storage" }),
    null,
  );
  view.rerender(React.createElement(PrivacyControls, { path: "/shop" }));
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  assert.equal(analytics.readConsent()?.analytics, false);
  cleanup();
  render(React.createElement(PrivacyControls, { path: "/shop" }));
  assert.equal(
    screen.queryByRole("region", { name: "Cookies and essential storage" }),
    null,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Cookie & storage preferences" }),
  );
  assert.ok(screen.getByText("Always active"));
  assert.ok(screen.getByText("Not in use"));
  assert.equal(screen.queryByRole("checkbox"), null);
  assert.equal(document.getElementById("furity-analytics"), null);
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  assert.equal(screen.queryByRole("dialog"), null);
  cleanup();
  localStorage.clear();
  siteConfig.analyticsId = previous;
});

test("optional analytics preference keeps keyboard focus and rejecting analytics preserves auth cookies", async () => {
  const { default: PrivacyControls } =
    await import("../src/components/PrivacyControls.tsx");
  const { siteConfig } = await import("../src/lib/config.ts");
  const analytics = await import("../src/lib/analytics.ts");
  const previous = siteConfig.analyticsId;
  siteConfig.analyticsId = "G-COOKIEUNIT";
  localStorage.clear();
  render(React.createElement(PrivacyControls, { path: "/shop" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Preferences", exact: true }),
  );
  const checkbox = screen.getByRole("checkbox", {
    name: "Allow optional Google Analytics",
  });
  await React.act(async () => checkbox.focus());
  fireEvent.click(checkbox);
  assert.ok(
    document.activeElement === checkbox,
    "Changing optional cookies must not reset dialog focus",
  );
  document.cookie = "__session=unit-auth-marker;path=/";
  document.cookie = "_ga=unit-analytics-marker;path=/";
  fireEvent.click(
    screen.getByRole("button", { name: "Essential only", exact: true }),
  );
  assert.equal(analytics.readConsent()?.analytics, false);
  assert.ok(document.cookie.includes("__session=unit-auth-marker"));
  assert.ok(!document.cookie.includes("_ga=unit-analytics-marker"));
  assert.equal(document.getElementById("furity-analytics"), null);
  document.cookie = "__session=;max-age=0;path=/";
  cleanup();
  localStorage.clear();
  siteConfig.analyticsId = previous;
});

test("header login opens an accessible dialog and returns to the shop without forcing sign-in", async () => {
  localStorage.clear();
  window.history.replaceState({}, "", "/shop");
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", { name: "Log in or manage your account" }),
  );
  const dialog = within(screen.getByRole("dialog"));
  await waitFor(() =>
    assert.ok(dialog.getByText("Accounts aren’t available here yet.")),
  );
  assert.equal(window.location.pathname, "/shop");
  assert.ok(document.getElementById("root")?.inert !== false);
  fireEvent.click(
    dialog.getByRole("button", { name: "Continue browsing as a guest" }),
  );
  assert.ok(screen.queryByRole("dialog") === null);
  cleanup();
});
test("live products, edited prices and saved dynamic carts are shared across catalogue and product detail views", async () => {
  const previous = globalThis.fetch;
  const { pickleProducts } = await import("../src/data/pickles.ts");
  const product = {
    ...pickleProducts[0],
    id: "owner-added-pickle",
    name: "Owner Added Pickle",
    price: 275,
  };
  globalThis.fetch = async () =>
    Response.json({ products: [...pickleProducts, product], revision: "unit" });
  try {
    localStorage.clear();
    localStorage.setItem(
      "fruity-pickle-selection-v1",
      JSON.stringify([product.id]),
    );
    localStorage.setItem(
      "fruity-pickle-quantities-v1",
      JSON.stringify({ [product.id]: 2 }),
    );
    window.history.replaceState({}, "", `/products/${product.id}`);
    mountPantry();
    await waitFor(() =>
      assert.ok(
        screen.getByRole("heading", { name: product.name, exact: true }),
      ),
    );
    assert.ok(screen.getByText("₹275"));
    assert.match(document.title, /Owner Added Pickle/);
    fireEvent.click(screen.getByRole("button", { name: "Open cart, 2 items" }));
    const dialog = within(screen.getByRole("dialog"));
    assert.ok(dialog.getByText("₹700"));
    assert.match(
      new URL(
        dialog
          .getByRole("link", { name: "Email", exact: true })
          .getAttribute("href")!,
      ).searchParams.get("body")!,
      /Total: ₹700/,
    );
    cleanup();
  } finally {
    globalThis.fetch = previous;
    cleanup();
    window.history.replaceState({}, "", "/");
  }
});
test("owner product editor handles refused access, preserves a failed edit, and confirms only a saved response", async () => {
  const previous = globalThis.fetch;
  const { pickleProducts } = await import("../src/data/pickles.ts");
  const { ProductManager } = await import("../src/components/AdminPanel.tsx");
  let unlockAllowed = false,
    saveAllowed = false;
  let savedBody: any;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options?.body as string);
    if (body.action === "unlock")
      return Response.json(
        unlockAllowed
          ? { products: pickleProducts, revision: "unit" }
          : { error: "This account does not have owner access." },
        { status: unlockAllowed ? 200 : 403 },
      );
    savedBody = body;
    return Response.json(
      saveAllowed
        ? { products: [body.product, pickleProducts[1]], revision: "saved" }
        : { error: "Try again. Changes were not saved." },
      { status: saveAllowed ? 200 : 503 },
    );
  };
  try {
    render(
      React.createElement(ProductManager, {
        getToken: async () => "unit-fixture-token",
      }),
    );
    fireEvent.change(screen.getByLabelText("Panel password"), {
      target: { value: "unit-fixture-password" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Unlock product panel" }),
    );
    await waitFor(() =>
      assert.ok(screen.getByText("This account does not have owner access.")),
    );
    unlockAllowed = true;
    fireEvent.click(
      screen.getByRole("button", { name: "Unlock product panel" }),
    );
    await waitFor(() =>
      assert.ok(screen.getByRole("heading", { name: "The pantry manager." })),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Pineapple Pickle.*₹200/ }),
    );
    fireEvent.change(screen.getByLabelText("Price (₹)"), {
      target: { value: "240" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      assert.ok(screen.getByText("Try again. Changes were not saved.")),
    );
    assert.equal(
      (screen.getByLabelText("Price (₹)") as HTMLInputElement).value,
      "240",
    );
    saveAllowed = true;
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      assert.ok(
        screen.getByText("Pineapple Pickle saved to the live catalogue."),
      ),
    );
    assert.equal(savedBody.product.price, 240);
    assert.equal(savedBody.product.jarSize, null);
    assert.equal(savedBody.revision, "unit");
    fireEvent.click(screen.getByRole("button", { name: /Lock panel/ }));
    assert.ok(screen.getByRole("button", { name: "Unlock product panel" }));
  } finally {
    globalThis.fetch = previous;
    cleanup();
  }
});

test("owner editor uploads a photo and publishes a new product with verified input and stable slug", async () => {
  const previous = globalThis.fetch;
  const reader = Object.getOwnPropertyDescriptor(globalThis, "FileReader");
  Object.defineProperty(globalThis, "FileReader", {
    value: dom.window.FileReader,
    configurable: true,
  });
  const { pickleProducts } = await import("../src/data/pickles.ts");
  const { ProductManager } = await import("../src/components/AdminPanel.tsx");
  const calls: { url: unknown; body: any }[] = [];
  const photoPath =
    "/api/product-image?id=11111111-1111-4111-8111-111111111111";
  globalThis.fetch = async (url, options) => {
    if (url === "/api/product-image") {
      calls.push({ url, body: options?.body });
      return Response.json({ image: photoPath });
    }
    const body = JSON.parse(options?.body as string);
    calls.push({ url, body });
    return Response.json(
      body.action === "unlock"
        ? { products: pickleProducts, revision: "unit" }
        : { products: [...pickleProducts, body.product], revision: "saved" },
    );
  };
  try {
    render(
      React.createElement(ProductManager, {
        getToken: async () => "unit-fixture-token",
      }),
    );
    fireEvent.change(screen.getByLabelText("Panel password"), {
      target: { value: "unit-fixture-password" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Unlock product panel" }),
    );
    await waitFor(() =>
      assert.ok(screen.getByRole("heading", { name: "The pantry manager." })),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add product", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Product name"), {
      target: { value: "New Pantry Pickle" },
    });
    assert.equal(
      (screen.getByLabelText("Product URL slug") as HTMLInputElement).value,
      "new-pantry-pickle",
    );
    fireEvent.change(screen.getByLabelText("Price (₹)"), {
      target: { value: "220" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Owner-supplied description for a unit-test product." },
    });
    fireEvent.change(screen.getByLabelText("Photo description"), {
      target: { value: "A pickle jar photographed on a tabletop" },
    });
    fireEvent.change(screen.getByLabelText(/Product photo/), {
      target: {
        files: [
          new dom.window.File([new Uint8Array([1, 2, 3])], "unit-photo.webp", {
            type: "image/webp",
          }),
        ],
      },
    });
    await waitFor(() =>
      assert.ok(screen.getByRole("img", { name: "Selected product preview" })),
    );
    fireEvent.click(screen.getByRole("button", { name: "Publish product" }));
    await waitFor(() =>
      assert.ok(
        screen.getByText("New Pantry Pickle saved to the live catalogue."),
      ),
    );
    assert.equal(calls.filter((c) => c.url === "/api/product-image").length, 1);
    const create = calls.find((c) => c.body.action === "create")!.body;
    assert.equal(create.product.price, 220);
    assert.equal(create.product.image, photoPath);
    assert.equal(create.product.jarSize, null);
    assert.equal(create.product.ingredients, null);
  } finally {
    globalThis.fetch = previous;
    if (reader) Object.defineProperty(globalThis, "FileReader", reader);
    else Reflect.deleteProperty(globalThis, "FileReader");
    cleanup();
  }
});

test("Jar Lab supports reversible pointer and slider controls without loading video in reduced motion", async () => {
  const { default: JarLab } = await import("../src/components/JarLab.tsx");
  render(React.createElement(JarLab));
  assert.equal(document.querySelectorAll(".jar-lab video").length, 0);
  const slider = screen.getByRole("slider", {
    name: "Jar lid openness",
  }) as HTMLInputElement;
  assert.equal(slider.disabled, true);
  fireEvent.click(screen.getByRole("button", { name: "Try the jar" }));
  assert.equal(slider.disabled, false);
  fireEvent.change(slider, { target: { value: "45" } });
  assert.equal(slider.value, "45");
  const stage = document.querySelector(".jar-lab-stage")!;
  const pointer = (type: string, y: number) => {
    const e = new dom.window.Event(type, { bubbles: true });
    Object.defineProperties(e, {
      pointerId: { value: 1 },
      clientY: { value: y },
      button: { value: 0 },
    });
    fireEvent(stage, e);
  };
  pointer("pointerdown", 180);
  pointer("pointermove", 45);
  pointer("pointerup", 45);
  assert.equal(slider.value, "100");
  assert.ok(screen.getByRole("button", { name: "Close the jar" }));
  pointer("pointerdown", 45);
  pointer("pointermove", 180);
  pointer("pointerup", 180);
  assert.equal(slider.value, "0");
  fireEvent.click(screen.getByRole("button", { name: "Open the jar" }));
  assert.equal(slider.value, "100");
  assert.equal(document.querySelectorAll(".jar-lab video").length, 0);
  assert.match(
    document.querySelector<HTMLImageElement>(".jar-lab-poster")!.src,
    /jar-lifted.webp/,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  assert.equal(slider.value, "0");
  cleanup();
});
test("product quick look zooms and restores focus; the pair action opens a delivery-inclusive guest cart", async () => {
  const { pickleProducts } = await import("../src/data/pickles.ts");
  const { default: ProductGallery } =
    await import("../src/components/ProductGallery.tsx");
  render(
    React.createElement(ProductGallery, {
      product: pickleProducts[0],
      compact: true,
    }),
  );
  const opener = screen.getByRole("button", {
    name: "Enlarge Pineapple Pickle photo",
  });
  await React.act(async () => opener.focus());
  fireEvent.click(opener);
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: "Zoom in" }));
  assert.ok(document.querySelector(".product-photo-viewer.is-zoomed"));
  fireEvent.click(dialog.getByRole("button", { name: "Back to shopping" }));
  assert.ok(document.activeElement === opener);
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/shop");
  mountPantry();
  fireEvent.click(screen.getByRole("button", { name: "Add both to cart" }));
  const cart = within(screen.getByRole("dialog"));
  assert.ok(cart.getByText("₹550"));
  assert.equal(cart.getAllByRole("img").length, 2);
  assert.match(
    new URL(
      cart
        .getByRole("link", { name: "WhatsApp", exact: true })
        .getAttribute("href")!,
    ).searchParams.get("text")!,
    /Delivery: ₹150/,
  );
  cleanup();
  window.history.replaceState({}, "", "/");
});
