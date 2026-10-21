import test from "node:test";
import assert from "node:assert/strict";
import {
  validateCheckout,
  estimate,
  restoreWishlist,
  restoreReceipts,
} from "../src/lib/store.ts";
test("delivery form errors identify the field and preserve valid sample data", () => {
  assert.equal(
    Object.keys(
      validateCheckout({
        name: "",
        email: "wrong",
        phone: "123",
        address: "",
        city: "",
        pin: "000000",
      }),
    ).length,
    6,
  );
  assert.deepEqual(
    validateCheckout({
      name: "Sample Buyer",
      email: "demo@example.test",
      phone: "9876543210",
      address: "12 Sample Road",
      city: "Hyderabad",
      pin: "500001",
    }),
    {},
  );
});
test("sample estimates handle delivery threshold, promo cap, and empty bags", () => {
  assert.deepEqual(estimate(0, ""), {
    subtotal: 0,
    discount: 0,
    delivery: 0,
    total: 0,
  });
  assert.equal(estimate(798, "").delivery, 49);
  assert.equal(estimate(799, "").delivery, 0);
  assert.equal(estimate(3000, "FRESH10").discount, 150);
  assert.equal(estimate(649, "FRESH10").total, 633);
  assert.equal(estimate(649, "INVALID").discount, 0);
});
test("persisted favorites and demo receipts reject malformed or unexpected records", () => {
  assert.deepEqual(restoreWishlist('["mango","unknown","mango",null]'), [
    "mango",
  ]);
  assert.deepEqual(restoreWishlist("{bad"), []);
  assert.deepEqual(restoreReceipts('[{"id":"real-order","total":200}]'), []);
  assert.deepEqual(
    restoreReceipts(
      '[{"id":"DEMO-1","created":"today","total":12,"items":[]}]',
    ),
    [],
  );
});
