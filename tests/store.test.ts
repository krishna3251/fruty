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
const { render, screen, fireEvent, cleanup, within } =
  await import("@testing-library/react");
const { default: App } = await import("../src/App.tsx");
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
    screen.getByText("Demo signup. Your email has not been submitted."),
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
      "You’re offline. Loaded products and your bag still work.",
    ),
  );
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
  fireEvent(window, new window.Event("online"));
  assert.equal(
    screen.queryByText(
      "You’re offline. Loaded products and your bag still work.",
    ),
    null,
  );
  cleanup();
});

test.after(() => {
  cleanup();
  ScrollTrigger.killAll();
  ScrollTrigger.disable(true);
  gsap.ticker.sleep();
  dom.window.close();
});
