import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validClerkPublishableKey } from "../src/lib/authConfig.ts";
import { accountPaths, pageMeta } from "../src/lib/seo.ts";
import { structuredData } from "../src/lib/structuredData.ts";
test("auth accepts only public frontend keys with valid host payloads", () => {
  const publicFixture = `pk_test_${btoa("unit.clerk.accounts.dev$")}`;
  assert.equal(validClerkPublishableKey(publicFixture), true);
  for (const value of [
    null,
    "",
    "sk_live_never_public",
    "pk_test_invalid",
    `pk_test_${btoa("https://user@evil.test/$")}`,
    `pk_test_${btoa("bad..host$")}`,
  ])
    assert.equal(validClerkPublishableKey(value), false);
});
test("account screens have noindex metadata, no product schema, and are excluded from the sitemap", () => {
  const sitemap = readFileSync("dist/sitemap.xml", "utf8");
  for (const path of accountPaths) {
    const html = readFileSync(`dist${path}/index.html`, "utf8");
    assert.equal(pageMeta(path).index, false);
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.ok(html.includes(`https://fruty-fawn.vercel.app${path}`));
    assert.equal(structuredData(path, "https://fruty-fawn.vercel.app"), null);
    assert.ok(!sitemap.includes(`${path}</loc>`));
  }
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const index = config.routes.findIndex(
    (r: any) => r.src === "/(account|sign-in|sign-up)/?",
  );
  assert.ok(
    index < config.routes.findIndex((r: any) => r.handle === "filesystem"),
  );
  assert.equal(
    config.routes[index].headers["Cache-Control"],
    "private, no-store",
  );
});
