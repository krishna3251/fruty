import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { accountProfile } from "../src/lib/profile.ts";

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
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  writable: true,
  configurable: true,
});
const React = await import("react");
const { render, screen, fireEvent, cleanup, waitFor } =
  await import("@testing-library/react");
const { SessionContext } = await import("../src/context/Session.tsx");
const { default: AccountAvatar } =
  await import("../src/components/AccountAvatar.tsx");
const { default: AccountWorkspace } =
  await import("../src/components/AccountWorkspace.tsx");
test.afterEach(() => cleanup());

test("account picture uses the connected Google image, unless the user has chosen a Clerk profile photo", () => {
  const user = {
    fullName: "Test Customer",
    primaryEmailAddress: { emailAddress: "customer@example.test" },
    hasImage: false,
    imageUrl: "https://img.clerk.com/default",
    externalAccounts: [
      {
        provider: "oauth_google",
        imageUrl: "https://lh3.googleusercontent.com/photo",
      },
    ],
  };
  assert.deepEqual(accountProfile(user), {
    displayName: "Test Customer",
    email: "customer@example.test",
    imageUrl: "https://lh3.googleusercontent.com/photo",
  });
  assert.equal(
    accountProfile({
      ...user,
      hasImage: true,
      imageUrl: "https://img.clerk.com/custom",
    }).imageUrl,
    "https://img.clerk.com/custom",
  );
  assert.equal(
    accountProfile({ hasImage: false, externalAccounts: [] }).imageUrl,
    null,
  );
});

test("account avatar recovers from a broken photo and displays a new photo after an account update", () => {
  const profile = {
    displayName: "Test Customer",
    email: "customer@example.test",
    imageUrl: "https://img.clerk.com/old",
  };
  const view = render(React.createElement(AccountAvatar, { profile }));
  const firstImage = view.container.querySelector("img")!;
  assert.equal(firstImage.getAttribute("src"), profile.imageUrl);
  fireEvent.error(firstImage);
  assert.equal(view.container.querySelector("img"), null);
  assert.match(view.container.textContent!, /TC/);
  view.rerender(
    React.createElement(AccountAvatar, {
      profile: { ...profile, imageUrl: "https://img.clerk.com/new" },
    }),
  );
  assert.equal(
    view.container.querySelector("img")?.getAttribute("src"),
    "https://img.clerk.com/new",
  );
});

test("account sections keep address management, enquiry history and privacy controls usable", async () => {
  const previous = globalThis.fetch;
  let addresses: any[] = [];
  let saved: any = null;
  const actions: string[] = [];
  globalThis.fetch = async (_url, options) => {
    const headers = options?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer fixture-token");
    const body = JSON.parse(String(options?.body));
    actions.push(body.action);
    if (body.action === "save-address") {
      saved = body.address;
      addresses = [
        { ...body.address, id: "11111111-1111-4111-8111-111111111111" },
      ];
    }
    if (body.action === "delete-address") addresses = [];
    return Response.json(
      body.action === "load" ? { addresses, orders: [] } : { ok: true },
    );
  };
  try {
    const getToken = async () => "fixture-token";
    render(
      React.createElement(
        SessionContext.Provider,
        {
          value: {
            status: "signed-in",
            userId: "test-customer",
            getToken,
            profile: {
              displayName: "Test Customer",
              email: "customer@example.test",
              imageUrl: null,
            },
          },
        },
        React.createElement(AccountWorkspace, {
          signOut: () => {},
          leaving: false,
          error: "",
          profileControls: React.createElement(
            "p",
            null,
            "Profile controls fixture",
          ),
        }),
      ),
    );
    await screen.findByText("No enquiries here yet");
    assert.ok(screen.getByText(/Direct WhatsApp or email drafts aren't saved/));
    fireEvent.click(screen.getByRole("button", { name: "Addresses" }));
    assert.ok(screen.getByText("No saved addresses"));
    assert.equal(screen.queryByLabelText("Recipient name"), null);
    fireEvent.click(screen.getByRole("button", { name: "Add address" }));
    for (const [label, value] of [
      ["Recipient name", "Test Customer"],
      ["Mobile number", "9876543210"],
      ["House / street address", "12 Sample Street"],
      ["Hyderabad locality", "Sample area"],
      ["PIN code", "500001"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByLabelText("Use as default address"));
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await screen.findByText(/Home · Default/);
    assert.equal(saved.pin, "500001");
    assert.equal(saved.isDefault, true);
    assert.equal(screen.queryByLabelText("Recipient name"), null);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    assert.equal(
      (screen.getByLabelText("Recipient name") as HTMLInputElement).value,
      "Test Customer",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete address" }));
    await screen.findByText("No saved addresses");
    fireEvent.click(screen.getByRole("button", { name: "Profile & security" }));
    assert.ok(screen.getByText("Profile controls fixture"));
    fireEvent.click(screen.getByRole("button", { name: "Privacy" }));
    fireEvent.click(screen.getByText("Delete my store data"));
    assert.equal(
      (
        screen.getByRole("button", {
          name: "Delete store data",
        }) as HTMLButtonElement
      ).disabled,
      true,
    );
    assert.ok(
      actions.includes("save-address") && actions.includes("delete-address"),
    );
    await waitFor(() =>
      assert.equal(
        screen
          .getByRole("button", { name: "Privacy" })
          .getAttribute("aria-pressed"),
        "true",
      ),
    );
  } finally {
    globalThis.fetch = previous;
  }
});
