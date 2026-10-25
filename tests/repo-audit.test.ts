import test from "node:test";
import assert from "node:assert/strict";
import { readBytes, readJson } from "../server/requestBody.ts";
import { ApiError } from "../server/admin.ts";
import { validateProduct } from "../src/lib/catalogue.ts";
import { pickleProducts } from "../src/data/pickles.ts";

test("upload reader cancels oversized chunked bodies without trusting Content-Length", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(8));
      controller.enqueue(new Uint8Array(8));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("https://shop.example.test/api/product-image", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(
    () => readBytes(request, 10),
    (e: unknown) => e instanceof ApiError && e.status === 413,
  );
  assert.ok(cancelled);
});
test("JSON mutations reject null, array and spoofed media types with client errors", async () => {
  for (const body of ["null", "[]", "1", "not json"]) {
    await assert.rejects(
      () =>
        readJson(
          new Request("https://shop.example.test/api/catalogue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }),
        ),
      (e: unknown) => e instanceof ApiError && e.status === 400,
    );
  }
  await assert.rejects(
    () =>
      readJson(
        new Request("https://shop.example.test/api/catalogue", {
          method: "POST",
          headers: { "Content-Type": "application/jsonp" },
          body: "{}",
        }),
      ),
    (e: unknown) => e instanceof ApiError && e.status === 415,
  );
  assert.deepEqual(
    await readJson(
      new Request("https://shop.example.test/api/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: '{"action":"unlock"}',
      }),
    ),
    { action: "unlock" },
  );
});
test("owner cannot create products on archived, redirected or permanently retired slugs", () => {
  for (const id of [
    "mango",
    "strawberry",
    "blueberry",
    "orange",
    "lemon",
    "avocado",
    "fermented-cucumber-pickle",
    "fermented-pale-vegetable-pickle",
  ])
    assert.throws(
      () => validateProduct({ ...pickleProducts[0], id }),
      /archived or retired/,
    );
  assert.equal(
    validateProduct({ ...pickleProducts[0], id: "owner-confirmed-new-jar" }).id,
    "owner-confirmed-new-jar",
  );
});
