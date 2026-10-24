import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enquiryGmail } from "../src/lib/contact.ts";
import { restoreQuantities } from "../src/context/PickleSelection.tsx";
import { pickleProducts } from "../src/data/pickles.ts";
import {
  structuredData,
  serializeStructuredData,
} from "../src/lib/structuredData.ts";

test("Gmail redirect contains the whole encoded draft, recipient and compose fields", () => {
  const message =
    "2 × Pineapple Pickle — ₹200 each\nProducts subtotal: ₹400\nQuestion: a&b <test>";
  const url = new URL(enquiryGmail(message)!);
  assert.equal(url.origin, "https://mail.google.com");
  assert.equal(url.pathname, "/mail/");
  assert.equal(url.searchParams.get("view"), "cm");
  assert.equal(url.searchParams.get("to"), "krishnasoni3251@gmail.com");
  assert.equal(url.searchParams.get("body"), message);
});
test("basket quantity restoration rejects tampered and invalid values and defaults old selections to one", () => {
  const ids = pickleProducts.map((p) => p.id);
  assert.deepEqual(
    restoreQuantities("broken", ids),
    Object.fromEntries(ids.map((id) => [id, 1])),
  );
  for (const invalid of [-1, 0, 1.5, 100, "2", null, {}, []])
    assert.equal(
      restoreQuantities(JSON.stringify({ [ids[0]]: invalid }), ids)[ids[0]],
      1,
    );
  const value = restoreQuantities(
    JSON.stringify({ [ids[0]]: 3, [ids[1]]: 99, unknown: 9 }),
    ids,
  );
  assert.deepEqual(value, { [ids[0]]: 3, [ids[1]]: 99 });
});
test("initial product HTML has accurate structured prices and breadcrumbs without invented commercial claims", () => {
  for (const p of pickleProducts) {
    const path = `/products/${p.id}`;
    const html = readFileSync(`dist${path}/index.html`, "utf8");
    const json = html.match(
      /<script id="page-structured-data" type="application\/ld\+json">(.*?)<\/script>/s,
    )![1];
    const graph = JSON.parse(json)["@graph"];
    const product = graph.find((x: any) => x["@type"] === "Product");
    assert.equal(product.name, p.name);
    assert.equal(product.offers.price, p.price);
    assert.equal(product.offers.priceCurrency, "INR");
    for (const key of [
      "availability",
      "shippingDetails",
      "hasMerchantReturnPolicy",
    ])
      assert.equal(product.offers[key], undefined);
    assert.equal(product.aggregateRating, undefined);
    assert.ok(product.image[0].startsWith("https://fruty-fawn.vercel.app/"));
    const crumbs = graph.find(
      (x: any) => x["@type"] === "BreadcrumbList",
    ).itemListElement;
    assert.equal(crumbs.at(-1).item, `https://fruty-fawn.vercel.app${path}`);
  }
  assert.equal(
    structuredData("/fruit-demo", "https://fruty-fawn.vercel.app"),
    null,
  );
  assert.equal(
    structuredData("/does-not-exist", "https://fruty-fawn.vercel.app"),
    null,
  );
  assert.ok(
    !serializeStructuredData({
      text: "</script><script>alert(1)</script>",
    }).includes("<"),
  );
});
test("deployment sets browser security restrictions and redirects the duplicate catalogue", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const h = config.routes.find(
    (r: any) => r.headers?.["Content-Security-Policy"],
  ).headers;
  assert.match(h["Content-Security-Policy"], /object-src 'none'/);
  assert.match(h["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.ok(!h["Content-Security-Policy"].includes("unsafe-eval"));
  assert.match(h["Strict-Transport-Security"], /max-age=31536000/);
  assert.equal(
    config.routes.find((r: any) => r.src === "/pickles/?").status,
    301,
  );
  assert.ok(
    !readFileSync("dist/sitemap.xml", "utf8").includes("/pickles</loc>"),
  );
});
