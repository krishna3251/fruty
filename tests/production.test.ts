import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  pageMeta,
  publicPaths,
  archivePaths,
  safeOrigin,
} from "../src/lib/seo.ts";
test("all public pages have unique titles, descriptions and build-time sharing/canonical metadata", () => {
  const titles = new Set<string>(),
    descriptions = new Set<string>();
  for (const path of publicPaths) {
    const m = pageMeta(path);
    assert.ok(m.title.length < 75);
    assert.ok(m.description.length > 50);
    titles.add(m.title);
    descriptions.add(m.description);
    const file = path === "/" ? "dist/index.html" : `dist${path}/index.html`;
    const html = readFileSync(file, "utf8");
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((html.match(/id="page-structured-data"/g) || []).length, 1);
    assert.equal((html.match(/<title>/g) || []).length, 1);
    assert.ok(
      html.includes(
        'property="og:image" content="https://fruty-fawn.vercel.app/social-card.png"',
      ),
    );
    assert.ok(html.includes(`href="https://fruty-fawn.vercel.app${path}"`));
    assert.ok(html.includes('name="twitter:card"'));
  }
  assert.equal(titles.size, publicPaths.length);
  assert.equal(descriptions.size, publicPaths.length);
});
test("robots/sitemap exclude confirmation and errors and contain the real production origin", () => {
  const xml = readFileSync("dist/sitemap.xml", "utf8");
  for (const path of publicPaths)
    assert.ok(xml.includes(`<loc>https://fruty-fawn.vercel.app${path}</loc>`));
  assert.ok(!xml.includes("/thank-you"));
  assert.ok(!xml.includes("/404"));
  assert.match(
    readFileSync("dist/robots.txt", "utf8"),
    /Sitemap: https:\/\/fruty-fawn.vercel.app\/sitemap.xml/,
  );
  assert.match(
    readFileSync("dist/thank-you/index.html", "utf8"),
    /noindex,follow/,
  );
});
test("social and icon assets exist and static routes target actual built files", () => {
  for (const file of [
    "social-card.png",
    "favicon.svg",
    "favicon-16.png",
    "favicon-32.png",
    "apple-touch-icon.png",
    "site.webmanifest",
    "icon-192.png",
    "icon-512.png",
  ])
    assert.ok(existsSync(`dist/${file}`));
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.equal(config.routes.at(-1).status, 404);
  assert.ok(existsSync("dist/privacy/index.html"));
  assert.ok(existsSync("dist/404.html"));
});
test("origin validation rejects credentials and accidental deployment paths", () => {
  assert.equal(
    safeOrigin("https://fruty-fawn.vercel.app"),
    "https://fruty-fawn.vercel.app",
  );
  for (const value of [
    "javascript:alert(1)",
    "https://user:pass@example.com",
    "https://example.com/shop",
    "https://example.com/?secret=x",
  ])
    assert.throws(() => safeOrigin(value));
});

test("pickle shop is indexable while archived fruit routes remain available and noindex", () => {
  assert.match(pageMeta("/shop").title, /Pickles/);
  assert.ok(publicPaths.includes("/ordering"));
  for (const path of archivePaths) {
    assert.ok(!publicPaths.includes(path));
    assert.equal(pageMeta(path).index, false);
    assert.match(
      readFileSync(`dist${path}/index.html`, "utf8"),
      /noindex,follow/,
    );
  }
  assert.ok(
    !readFileSync("dist/sitemap.xml", "utf8").includes("/products/mango"),
  );
});
