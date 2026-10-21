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
  assert.ok(within(dialog).getByText("Alphonso Mangoes × 2"));
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Finish demo checkout" }),
  );
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
test.after(() => {
  cleanup();
  ScrollTrigger.killAll();
  ScrollTrigger.disable(true);
  gsap.ticker.sleep();
  dom.window.close();
});
