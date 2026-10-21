import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreCart,
  changeQuantity,
  MAX_QUANTITY,
} from "../src/context/cartModel.ts";
import { products, money } from "../src/data/products.ts";
const ids = products.filter((p) => p.available).map((p) => p.id);
test("restoration rejects corrupt or tampered carts, unavailable products, and invalid quantities", () => {
  for (const raw of ["no json", "null", "[]", "12", '"fruit"'])
    assert.deepEqual(restoreCart(raw, ids), {});
  assert.deepEqual(
    restoreCart(
      JSON.stringify({
        mango: 2,
        orange: 1,
        strawberry: -1,
        blueberry: 1.5,
        lemon: 100,
        avocado: 2,
        unknown: 4,
      }),
      ids,
    ),
    { mango: 2, orange: 1 },
  );
  assert.deepEqual(restoreCart(JSON.stringify({ mango: "4" }), ids), {});
});
test("quantity updates preserve other products and remove zero quantities", () => {
  const before = { mango: 2, orange: 1 };
  assert.deepEqual(changeQuantity(before, "mango", 1), { mango: 3, orange: 1 });
  assert.deepEqual(before, { mango: 2, orange: 1 });
  assert.deepEqual(changeQuantity(before, "orange", -1), { mango: 2 });
  assert.deepEqual(changeQuantity({}, "mango", -1), {});
});
test("quantities cap at the demo maximum and restored totals use catalogue prices", () => {
  assert.deepEqual(changeQuantity({ mango: MAX_QUANTITY }, "mango", 1), {
    mango: MAX_QUANTITY,
  });
  const cart = restoreCart('{"mango":2,"strawberry":3}', ids);
  const total = products.reduce(
    (sum, p) => sum + p.price * (cart[p.id] || 0),
    0,
  );
  assert.equal(total, 2045);
  assert.match(money(total), /2,045/);
});
test("catalogue has unique stable ids and valid local image paths", async () => {
  const { existsSync } = await import("node:fs");
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  for (const p of products) {
    assert.ok(Number.isInteger(p.price) && p.price > 0);
    assert.ok(
      existsSync(new URL(`../public/images/${p.image}.webp`, import.meta.url)),
    );
  }
});
