import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  pickleProducts,
  pickleCollections,
  filterPickles,
  safeEnquiryUrl,
} from "../src/data/pickles.ts";
import { restoreSelection } from "../src/context/PickleSelection.tsx";
import { products } from "../src/data/products.ts";
import { restoreCart } from "../src/context/cartModel.ts";
test("supplied pickle records remain distinct, owner-priced, local and outside the fruit checkout", () => {
  assert.equal(pickleProducts.length, 2);
  assert.equal(
    new Set([...products, ...pickleProducts].map((p) => p.id)).size,
    products.length + 2,
  );
  assert.equal(pickleCollections.length, 1);
  assert.equal(pickleCollections[0].id, "tropical-feast");
  for (const p of pickleProducts) {
    assert.equal(p.price, 200);
    assert.equal(p.jarSize, null);
    assert.equal(p.ingredients, null);
    assert.equal(p.currency, "INR");
    assert.equal(p.availability, "unconfirmed");
    assert.ok(existsSync(`public${p.image}`));
    assert.equal(p.imageType, "owner-supplied");
    assert.equal(
      p.serviceArea,
      p.collectionId === "tropical-feast" ? "Hyderabad only" : null,
    );
    assert.equal(
      p.orderMethod,
      p.collectionId === "tropical-feast" ? "direct-message" : null,
    );
    assert.equal(
      readFileSync(`public${p.image}`).subarray(0, 4).toString(),
      "RIFF",
    );
    assert.deepEqual(
      restoreCart(
        JSON.stringify({ [p.id]: 1 }),
        products.map((p) => p.id),
      ),
      {},
    );
  }
  assert.equal(filterPickles("all", "cucumber").length, 1);
  assert.equal(filterPickles("tropical-feast", "spicy").length, 2);
  assert.deepEqual(
    restoreSelection(
      JSON.stringify([
        "fermented-cucumber-pickle",
        "tropical-cucumber-pickle",
        "fermented-pale-vegetable-pickle",
      ]),
    ),
    ["tropical-cucumber-pickle"],
  );
});
test("enquiry URLs reject unsafe schemes and embedded credentials", () => {
  for (const url of [
    "",
    "javascript:alert(1)",
    "http://dm.example.test",
    "https://user:password@dm.example.test",
    "/contact",
    "mailto:a@example.test",
  ])
    assert.equal(safeEnquiryUrl(url), null);
  assert.equal(
    safeEnquiryUrl("https://dm.example.test/supplier"),
    "https://dm.example.test/supplier",
  );
});

test("pickle enquiry restoration accepts only unique known product IDs", () => {
  assert.deepEqual(restoreSelection("invalid JSON"), []);
  assert.deepEqual(
    restoreSelection(
      JSON.stringify([
        "mango",
        "tropical-pineapple-pickle",
        "tropical-pineapple-pickle",
        1,
        "unknown",
      ]),
    ),
    ["tropical-pineapple-pickle"],
  );
});
