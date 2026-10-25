import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  ownerMatches,
  verifyPanelPassword,
  requireOwner,
  ApiError,
} from "../server/admin.ts";
import { validateProduct, cartTotals } from "../src/lib/catalogue.ts";
import { pickleProducts } from "../src/data/pickles.ts";
import { productHtml } from "../server/productPage.ts";
import { POST as writeProduct } from "../api/catalogue.ts";
import { POST as uploadImage, imageType } from "../api/product-image.ts";
test("owner access requires verified email and the panel hash verifies without storing a plaintext password", () => {
  assert.equal(
    ownerMatches(
      {
        emailAddresses: [
          {
            emailAddress: "owner@example.test",
            verification: { status: "unverified" },
          },
        ],
      },
      "owner@example.test",
    ),
    false,
  );
  assert.equal(
    ownerMatches(
      {
        emailAddresses: [
          {
            emailAddress: "visitor@example.test",
            verification: { status: "verified" },
          },
        ],
      },
      "owner@example.test",
    ),
    false,
  );
  assert.equal(
    ownerMatches(
      {
        emailAddresses: [
          {
            emailAddress: "Owner@example.test",
            verification: { status: "verified" },
          },
        ],
      },
      "owner@example.test",
    ),
    true,
  );
  const fixture = "unit-password-only";
  const salt = "unit-salt";
  const hash = `${salt}:${scryptSync(fixture, salt, 64).toString("hex")}`;
  assert.equal(verifyPanelPassword(fixture, hash), true);
  assert.equal(verifyPanelPassword("wrong", hash), false);
  assert.equal(verifyPanelPassword("wrong", "invalid"), false);
});
test("foreign-origin and unauthenticated product mutations fail before storage access", async () => {
  await assert.rejects(
    () =>
      requireOwner(
        new Request("https://fruty-fawn.vercel.app/api/catalogue", {
          method: "POST",
          headers: { origin: "https://attacker.test" },
        }),
      ),
    (e: unknown) => e instanceof ApiError && e.status === 403,
  );
  for (const handler of [writeProduct, uploadImage]) {
    const response = await handler(
      new Request("https://fruty-fawn.vercel.app/api/catalogue", {
        method: "POST",
        headers: { origin: "https://attacker.test" },
        body: "{}",
      }),
    );
    assert.equal(response.status, 403);
    assert.match(response.headers.get("cache-control")!, /no-store/);
  }
});
test("product validation rejects script content, external photos, invalid prices, unsafe slugs and invented privileged fields", () => {
  const p = pickleProducts[0];
  assert.equal(validateProduct({ ...p, price: 199.99 }).price, 199.99);
  for (const change of [
    { name: "<script>" },
    { image: "https://attacker.test/p.jpg" },
    { price: -2 },
    { price: NaN },
    { price: 200.001 },
    { id: "../../secrets" },
    { availability: "anything" },
  ])
    assert.throws(() => validateProduct({ ...p, ...change }));
  assert.equal(
    validateProduct({ ...p, jarSize: "", ingredients: null }).jarSize,
    null,
  );
  assert.equal(
    validateProduct({ ...p, collectionId: "fake", currency: "USD" }).currency,
    "INR",
  );
});
test("delivery remains unconfirmed for nonempty carts and empty carts have zero total", () => {
  assert.deepEqual(cartTotals([], {}), { subtotal: 0, delivery: 0, total: 0 });
  assert.deepEqual(
    cartTotals(pickleProducts, {
      [pickleProducts[0].id]: 2,
      [pickleProducts[1].id]: 1,
    }),
    { subtotal: 447, delivery: null, total: null },
  );
});
test("image validation excludes SVG and executable uploads", () => {
  assert.equal(imageType(Buffer.from("<svg onload=alert(1)>")), null);
  assert.equal(imageType(Buffer.from("not an image")), null);
  assert.equal(
    imageType(readFileSync(`public${pickleProducts[0].image}`)),
    "image/webp",
  );
});
test("live product HTML replaces stale metadata and escapes owner content without adding fake stock or ratings", () => {
  const product = {
    ...pickleProducts[0],
    name: "Updated & Pickle",
    price: 250,
  };
  const html = productHtml(
    readFileSync("dist/index.html", "utf8"),
    product,
    "https://fruty-fawn.vercel.app",
  );
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.match(html, /<title>Updated &amp; Pickle/);
  assert.match(html, /"price":250/);
  assert.ok(!html.includes("aggregateRating"));
  assert.ok(!html.includes('"availability"'));
  assert.match(html, /Delivery charges confirmed on WhatsApp/);
});
