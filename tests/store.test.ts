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
  assert.equal(screen.queryByRole("dialog"), null);
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
    main.getByRole("link", { name: "View Pineapple Pickle — Tropical Feast" }),
  );
  await waitFor(() =>
    assert.ok(
      main.getByRole("heading", { level: 1, name: "Pineapple Pickle" }),
    ),
  );
  assert.equal(window.location.pathname, "/products/tropical-pineapple-pickle");
  assert.ok(main.getByText("Hyderabad only"));
  assert.equal(main.queryByRole("button", { name: /add.*bag/i }), null);
  assert.ok(main.getByText("Ordering channel awaiting confirmation"));
  assert.equal(main.queryByRole("link", { name: "DM Tropical Feast" }), null);
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
      main.queryByText("Hyderabad only") !== null,
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
      screen.queryByRole("link", { name: "DM Tropical Feast" }),
      null,
    );
    cleanup();
    siteConfig.tropicalFeastDmUrl = "https://dm.example.test/verified-supplier";
    render(React.createElement(TropicalOrdering));
    const link = screen.getByRole("link", { name: "DM Tropical Feast" });
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
      name: "Save Cucumber Pickle — Tropical Feast",
      exact: true,
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Save Pineapple Pickle — Tropical Feast",
      exact: true,
    }),
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem("fruity-pickle-selection-v1")!),
    ["tropical-cucumber-pickle", "tropical-pineapple-pickle"],
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Open enquiry list, 2 items",
      exact: true,
    }),
  );
  const dialog = within(screen.getByRole("dialog"));
  assert.ok(
    dialog.getByRole("heading", { name: "Tropical Feast", exact: true }),
  );
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
    assert.match(copied, /confirm prices, jar sizes, ingredients/);
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
      name: "Open enquiry list, 1 items",
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
  fireEvent.click(screen.getByRole("button", { name: "Review enquiry list" }));
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
test("primary product details save unpriced pickles while archived fruit cart remains separately usable", async () => {
  localStorage.clear();
  window.history.replaceState({}, "", "/products/tropical-pineapple-pickle");
  mountPantry();
  fireEvent.click(
    screen.getByRole("button", { name: "Save to enquiry list", exact: true }),
  );
  assert.ok(
    screen.getByRole("button", { name: "Saved to enquiry list", exact: true }),
  );
  assert.equal(screen.queryByRole("button", { name: /add.*bag/i }), null);
  assert.ok(screen.getByText("Hyderabad only"));
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

test.after(() => {
  cleanup();
  ScrollTrigger.killAll();
  ScrollTrigger.disable(true);
  gsap.ticker.sleep();
  dom.window.close();
});
