import test from "node:test";
import { sqlStatements } from "../scripts/sqlStatements.ts";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { neonConfig } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import {
  validateAddress,
  emptyAddress,
  validateCart,
  deliveryQuote,
  validateSettings,
  orderMessage,
} from "../src/lib/customer.ts";
import { businessDefaults } from "../src/lib/business.ts";
import { pickleProducts } from "../src/data/pickles.ts";
import {
  customerRecord,
  accountData,
  syncCart,
  saveAddress,
  deleteAddress,
  deleteCustomer,
  createEnquiry,
  rateLimit,
  updateOrder,
  saveSettings,
  publicSettings,
} from "../server/commerce.ts";
import { POST as customerEndpoint } from "../api/customer.ts";
import { POST as enquiryEndpoint } from "../api/enquiry.ts";
import { POST as ownerEndpoint } from "../api/owner-orders.ts";
import { readJson, customerIdentity } from "../server/customerAuth.ts";
const address = {
  ...emptyAddress,
  recipient: "Test Buyer",
  phone: "9876543210",
  street: "12 Test Street",
  locality: "Test locality",
  pin: "500001",
};
const engine = new PGlite();
const previousFetch = neonConfig.fetchFunction;
const previousUrl = process.env.DATABASE_URL;
test.before(async () => {
  await engine.exec(
    await readFile("migrations/001_customer_commerce.sql", "utf8"),
  );
  process.env.DATABASE_URL =
    "postgresql://fixture:fixture@unit.neon.test/fixture";
  // Exercise production parameterized Neon query generation against isolated PostgreSQL,
  // using a local HTTP transport adapter. This is not a real Neon/OAuth test.
  neonConfig.fetchFunction = async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    const execute = async (client: any, q: any) => {
      const r = await client.query(q.query, q.params);
      return {
        fields: r.fields,
        rows: r.rows.map((row: any) =>
          r.fields.map((f: any) => {
            const value = row[f.name];
            return value == null
              ? null
              : typeof value === "object"
                ? value instanceof Date
                  ? value.toISOString()
                  : JSON.stringify(value)
                : String(value);
          }),
        ),
        rowCount: r.affectedRows ?? r.rows.length,
        command: "SELECT",
      };
    };
    try {
      return Response.json(
        body.queries
          ? {
              results: await engine.transaction(async (tx) => {
                const result = [];
                for (const q of body.queries) result.push(await execute(tx, q));
                return result;
              }),
            }
          : await execute(engine, body),
      );
    } catch (e: any) {
      return Response.json(
        { message: e.message, code: e.code },
        { status: 400 },
      );
    }
  };
});
test.after(async () => {
  neonConfig.fetchFunction = previousFetch;
  if (previousUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousUrl;
  await engine.close();
});
test("new confirmed catalogue and business configuration keep unknown stock and use owner-confirmed standard delivery", () => {
  for (const p of pickleProducts) {
    assert.equal(p.price, 149);
    assert.equal(p.jarSize, "200 g");
    assert.equal(p.ingredients, null);
    assert.equal(p.stockQuantity, undefined);
  }
  assert.equal(businessDefaults.email, "tropicalfeast7@gmail.com");
  assert.deepEqual(deliveryQuote(businessDefaults, "500001", 298), {
    delivery: 150,
    total: 448,
    coverage: "unconfirmed",
  });
  const s = validateSettings({
    ...businessDefaults,
    areas: [{ name: "Owner-confirmed test area", pins: ["500001"], rate: 50 }],
    freeDeliveryThreshold: 500,
  });
  assert.equal(deliveryQuote(s, "500001", 298).total, 348);
  assert.equal(deliveryQuote(s, "500001", 500).delivery, 0);
  assert.equal(deliveryQuote(s, "500002", 1000).delivery, 150);
  assert.throws(() => validateSettings({ ...s, whatsapp: "javascript:bad" }));
  assert.throws(() =>
    validateSettings({
      ...s,
      areas: [{ name: "bad", pins: ["123"], rate: -1 }],
    }),
  );
});
test("delivery data and cart validation reject injected text, unsupported cities, bad phones, quantities and unavailable products", () => {
  assert.equal(validateAddress(address).phone, "9876543210");
  for (const change of [
    { recipient: "<script>" },
    { phone: "123" },
    { pin: "123456" },
    { city: "Delhi" },
    { state: "Maharashtra" },
    { street: "\u0000bad" },
  ])
    assert.throws(() => validateAddress({ ...address, ...change }));
  for (const value of [
    { fake: 1 },
    { [pickleProducts[0].id]: -1 },
    { [pickleProducts[0].id]: 1.5 },
    { [pickleProducts[0].id]: 100 },
  ])
    assert.throws(() => validateCart(value, pickleProducts));
  assert.throws(() =>
    validateCart({ [pickleProducts[0].id]: 2 }, [
      { ...pickleProducts[0], stockQuantity: 1 },
    ]),
  );
  assert.throws(() =>
    validateCart({ [pickleProducts[0].id]: 1 }, [
      { ...pickleProducts[0], availability: "unavailable" },
    ]),
  );
});
test("versioned migration statements can be reapplied atomically in isolated PostgreSQL", async () => {
  const source = await readFile("migrations/001_customer_commerce.sql", "utf8");
  await engine.transaction(async (tx) => {
    for (const statement of sqlStatements(source)) await tx.query(statement);
  });
  assert.ok(sqlStatements(source).length > 10);
  assert.deepEqual(sqlStatements("SELECT 'a;b'; SELECT $$c;d$$;"), [
    "SELECT 'a;b'",
    "SELECT $$c;d$$",
  ]);
  assert.throws(() => sqlStatements("SELECT $$broken"));
});

test("profiles use verified server identity; account carts merge deterministically, retry idempotently and reject stale saves", async () => {
  const a = await customerRecord({
    userId: "clerk-test-a",
    name: "A",
    email: "a@example.test",
  });
  const b = await customerRecord({
    userId: "clerk-test-b",
    name: "B",
    email: "b@example.test",
  });
  const id = pickleProducts[0].id;
  const mergeId = randomUUID();
  let cart = await syncCart(a.id, { [id]: 2 }, 0, mergeId, pickleProducts);
  assert.equal(cart.items[id], 2);
  const duplicate = await syncCart(
    a.id,
    { [id]: 2 },
    0,
    mergeId,
    pickleProducts,
  );
  assert.equal(duplicate.version, cart.version);
  cart = await syncCart(a.id, { [id]: 3 }, 0, randomUUID(), pickleProducts);
  assert.equal(cart.items[id], 3);
  await assert.rejects(
    () => syncCart(a.id, { [id]: 1 }, 0, undefined, pickleProducts),
    /cart_conflict/,
  );
  cart = await syncCart(a.id, {}, cart.version, undefined, pickleProducts);
  assert.deepEqual(cart.items, {});
  const dataB = await accountData(b.id);
  assert.deepEqual(dataB.cart.items, {});
  const same = await customerRecord({
    userId: "clerk-test-a",
    name: "A Updated",
    email: "a@example.test",
  });
  assert.equal(same.id, a.id);
});
test("saved addresses are scoped by customer, default changes are atomic, and deletion cannot cross accounts", async () => {
  const a = await customerRecord({
    userId: "address-a",
    name: "A",
    email: null,
  });
  const b = await customerRecord({
    userId: "address-b",
    name: "B",
    email: null,
  });
  const first = await saveAddress(a.id, { ...address, isDefault: true });
  const second = await saveAddress(a.id, {
    ...address,
    label: "Work",
    isDefault: true,
  });
  const data = await accountData(a.id);
  assert.equal(data.addresses.filter((a) => a.isDefault).length, 1);
  assert.equal(data.addresses.find((a) => a.id === second.id)?.isDefault, true);
  await assert.rejects(
    () => saveAddress(b.id, { ...address, id: first.id }),
    /address_not_found/,
  );
  await assert.rejects(
    () => deleteAddress(b.id, first.id),
    /Address not found/,
  );
  assert.equal((await accountData(b.id)).addresses.length, 0);
  await deleteAddress(a.id, first.id);
  assert.equal((await accountData(a.id)).addresses.length, 1);
});
test("enquiries snapshot authoritative prices, calculate delivery estimates without confirming an order, and deduplicate retries", async () => {
  const a = await customerRecord({ userId: "order-a", name: "A", email: null });
  const b = await customerRecord({ userId: "order-b", name: "B", email: null });
  const request = {
    requestId: randomUUID(),
    customer: address,
    items: { [pickleProducts[0].id]: 2 },
    price: 1,
    total: 1,
    status: "delivered",
    customerId: b.id,
  };
  const first = await createEnquiry(request, a.id, pickleProducts);
  const second = await createEnquiry(request, a.id, pickleProducts);
  assert.equal(first.reference, second.reference);
  assert.equal(first.subtotal, 298);
  assert.equal(first.delivery, 150);
  assert.equal(first.total, 448);
  assert.equal(first.status, "enquiry_initiated");
  assert.equal(first.items[0].price, 149);
  assert.match(first.message, /200 g/);
  assert.match(first.message, /Estimated total: ₹448/);
  assert.equal(new URL(first.url!).searchParams.get("text"), first.message);
  assert.equal((await accountData(a.id)).orders.length, 1);
  assert.equal((await accountData(b.id)).orders.length, 0);
  await assert.rejects(
    () => createEnquiry(request, b.id, pickleProducts),
    /details changed/,
  );
  await assert.rejects(
    () =>
      createEnquiry(
        { ...request, requestId: randomUUID(), items: {} },
        null,
        pickleProducts,
      ),
    /Add a jar/,
  );
  const guest = await createEnquiry(
    { ...request, requestId: randomUUID() },
    null,
    pickleProducts,
  );
  assert.ok(guest.reference.startsWith("TF-"));
  await deleteCustomer(a.id);
  assert.equal(
    (
      await engine.query("SELECT * FROM tf_orders WHERE reference=$1", [
        first.reference,
      ])
    ).rows.length,
    0,
  );
});
test("business settings persist and stale edits fail without overwriting newer settings", async () => {
  const initial = await publicSettings();
  const saved = await saveSettings(
    { ...initial.settings, hours: "Owner-confirmed test hours" },
    initial.version,
  );
  assert.equal(saved.settings.hours, "Owner-confirmed test hours");
  await assert.rejects(
    () =>
      saveSettings({ ...initial.settings, hours: "Stale" }, initial.version),
    /changed/,
  );
  assert.equal(
    (await publicSettings()).settings.hours,
    "Owner-confirmed test hours",
  );
});
test("persistent rate limits reject excess requests rather than relying on a function-local counter", async () => {
  const key = randomUUID();
  await rateLimit(key, 2);
  await rateLimit(key, 2);
  await assert.rejects(() => rateLimit(key, 2), /Too many attempts/);
});
test("foreign origins and missing authentication cannot reach protected customer or owner operations", async () => {
  for (const handler of [customerEndpoint, enquiryEndpoint, ownerEndpoint]) {
    const r = await handler(
      new Request("https://fruty-fawn.vercel.app/api/customer", {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "application/json",
        },
        body: '{"action":"load","customerId":"another-person"}',
      }),
    );
    assert.equal(r.status, 403);
    assert.match(r.headers.get("cache-control")!, /no-store/);
  }
  const r = await customerEndpoint(
    new Request("https://fruty-fawn.vercel.app/api/customer", {
      method: "POST",
      headers: {
        Origin: "https://fruty-fawn.vercel.app",
        "Content-Type": "application/json",
      },
      body: '{"action":"load"}',
    }),
  );
  assert.ok([401, 503].includes(r.status));
  const guest = await customerIdentity(
    new Request("https://fruty-fawn.vercel.app/api/enquiry", {
      headers: {
        Origin: "https://fruty-fawn.vercel.app",
        Cookie: "__session=expired",
      },
    }),
    true,
  );
  assert.equal(guest, null);
});
test("JSON request limits and media types reject malformed bodies before processing", async () => {
  await assert.rejects(
    () =>
      readJson(
        new Request("https://unit.test", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "{}",
        }),
      ),
    /Send JSON/,
  );
  await assert.rejects(
    () =>
      readJson(
        new Request("https://unit.test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"text":"' + "x".repeat(25000) + '"}',
        }),
      ),
    /too large/,
  );
  assert.match(
    orderMessage({
      reference: "TF-TEST",
      customer: address,
      items: [
        { id: "a", name: "Pickle", jarSize: "200 g", price: 149, quantity: 1 },
      ],
      subtotal: 149,
    }),
    /not a confirmed order/,
  );
});

test("only the protected business workflow can set a confirmed amount; updates keep history and reject stale edits", async () => {
  const created = await createEnquiry(
    {
      requestId: randomUUID(),
      customer: address,
      items: { [pickleProducts[0].id]: 1 },
    },
    null,
    pickleProducts,
  );
  const row = (
    await engine.query<{ id: string }>(
      "SELECT id FROM tf_orders WHERE reference=$1",
      [created.reference],
    )
  ).rows[0];
  const input = {
    id: row.id,
    action: "update",
    version: 0,
    status: "confirmed",
    delivery: null,
    paymentMethod: "unconfirmed",
    paymentStatus: "unpaid",
  };
  await assert.rejects(
    () => updateOrder(input, "verified-owner"),
    /Confirm the delivery charge/,
  );
  const confirmed = await updateOrder(
    { ...input, delivery: 50, paymentMethod: "Agreed outside website" },
    "verified-owner",
  );
  assert.equal(Number(confirmed.total), 199);
  assert.equal(confirmed.status, "confirmed");
  assert.equal(confirmed.history.length, 2);
  await assert.rejects(
    () => updateOrder({ ...input, delivery: 50 }, "verified-owner"),
    /changed/,
  );
  await assert.rejects(
    () =>
      updateOrder({ ...input, version: 1, delivery: -10 }, "verified-owner"),
    /Check the delivery/,
  );
  const delivered = await updateOrder(
    {
      ...input,
      version: 1,
      status: "delivered",
      delivery: 50,
      paymentStatus: "paid",
    },
    "verified-owner",
  );
  assert.equal(delivered.history.length, 3);
  assert.equal(delivered.status, "delivered");
});

test("delivery instructions are bounded and server snapshots retain estimated delivery without confirming purchase", async () => {
  assert.throws(
    () => validateAddress({ ...address, instructions: "<script>" }),
    /instructions/,
  );
  assert.throws(
    () => validateAddress({ ...address, instructions: "x".repeat(301) }),
    /instructions/,
  );
  const request = {
    requestId: randomUUID(),
    customer: { ...address, instructions: "Call at the gate" },
    items: { [pickleProducts[0].id]: 1 },
    delivery: 0,
    total: 1,
  };
  const created = await createEnquiry(request, null, pickleProducts);
  assert.equal(created.delivery, 150);
  assert.equal(created.total, 299);
  assert.match(created.message, /Line total ₹149/);
  assert.match(created.message, /Delivery instructions: Call at the gate/);
  assert.equal(created.status, "enquiry_initiated");
  const row = (
    await engine.query<any>(
      "SELECT delivery,total,status,payment_status FROM tf_orders WHERE reference=$1",
      [created.reference],
    )
  ).rows[0];
  assert.equal(Number(row.delivery), 150);
  assert.equal(Number(row.total), 299);
  assert.equal(row.payment_status, "unpaid");
});
