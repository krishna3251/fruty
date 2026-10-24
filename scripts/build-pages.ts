import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadEnv } from "vite";
import { pickleProducts, safeEnquiryUrl } from "../src/data/pickles.ts";
import { siteConfig } from "../src/lib/config.ts";
import {
  pageMeta,
  publicPaths,
  archivePaths,
  safeOrigin,
} from "../src/lib/seo.ts";
import {
  structuredData,
  serializeStructuredData,
} from "../src/lib/structuredData.ts";
const env = {
  ...loadEnv("production", process.cwd(), "VITE_"),
  ...process.env,
};
const origin = safeOrigin(
  env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app",
);
const base = readFileSync("dist/index.html", "utf8");
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const fallback = (path: string) => {
  if (!publicPaths.includes(path)) return "";
  const product = pickleProducts.find((p) => path === `/products/${p.id}`);
  const shown = product ? [product] : pickleProducts;
  const email = env.VITE_CONTACT_EMAIL || siteConfig.email;
  const gmail = new URL("https://mail.google.com/mail/");
  gmail.search = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: "Tropical Feast pickle enquiry",
  }).toString();
  const whatsapp = safeEnquiryUrl(
    env.VITE_TROPICAL_FEAST_DM_URL || siteConfig.tropicalFeastDmUrl,
  );
  if (["/privacy", "/terms", "/contact", "/ordering"].includes(path)) {
    const meta = pageMeta(path);
    const notice =
      path === "/privacy"
        ? "The site saves selected products and quantities on your device. Optional analytics is disabled unless configured and accepted. Enquiry links open external Gmail or WhatsApp drafts; nothing is sent automatically. No online payments are collected. Enable JavaScript to read and manage the full storage and consent notice."
        : path === "/terms"
          ? "This is an enquiry catalogue, not an online checkout. Both products cost ₹200 each; confirm jar size, ingredients/allergens, stock, delivery and total charges with the supplier. Seller identity, delivery and refund terms still require owner confirmation. No order is confirmed by this website. Enable JavaScript to read the complete editable terms."
          : "Tropical Feast enquiries are for Hyderabad. Confirm all product and delivery details directly before ordering. No online payment is taken. Enable JavaScript for the full contact and ordering information.";
    return `<noscript><main class="pantry-store information-page section-pad"><a href="/">Fermented Pickles</a><h1>${escape(meta.title)}</h1><p>${escape(notice)}</p><p>${escape(meta.description)}</p><a href="/shop">Browse both flavours</a></main></noscript>`;
  }
  return `<noscript><main class="pantry-store information-page section-pad"><a href="/">Fermented Pickles</a><h1>${escape(product?.name || "Pineapple & Cucumber Pickles")}</h1><p>The animated film and saved basket need JavaScript. You can still browse the products and open an enquiry below. Hyderabad enquiries only; no online payment is taken.</p>${shown.map((p) => `<article><h2><a href="/products/${p.id}">${escape(p.name)}</a></h2><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" width="300" height="200"><p>${escape(p.description)}</p><p>${p.price === null ? "Price on enquiry" : `₹${p.price}`} · Confirm jar size, ingredients/allergens, availability and delivery.</p></article>`).join("")}<p>${whatsapp ? `<a href="${escape(whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp enquiry</a> · ` : ""}${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `<a href="${escape(gmail.href)}" target="_blank" rel="noopener noreferrer">Open Gmail</a>` : ""}</p><a href="/shop">View both flavours</a></main></noscript>`;
};
for (const path of [...publicPaths, ...archivePaths, "/thank-you"]) {
  const m = pageMeta(path);
  let html = base
    .replace(/<title>.*?<\/title>/s, "")
    .replace(/<meta\s+name="description"[^>]*>/s, "");
  const url = origin + path;
  const tags = `<title>${escape(m.title)}</title><meta name="description" content="${escape(m.description)}"><meta name="robots" content="${m.index ? "index,follow" : "noindex,follow"}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Fermented Pickles"><meta property="og:image" content="${origin}/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Tropical Feast — Pineapple and cucumber pickles"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(m.title)}"><meta name="twitter:description" content="${escape(m.description)}"><meta name="twitter:image" content="${origin}/social-card.png">`;
  const data = structuredData(path, origin);
  const jsonLd = data
    ? `<script id="page-structured-data" type="application/ld+json">${serializeStructuredData(data)}</script>`
    : "";
  html = html
    .replace("</head>", tags + jsonLd + "</head>")
    .replace("</body>", fallback(path) + "</body>");
  const file = path === "/" ? "dist/index.html" : `dist${path}/index.html`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths.map((p) => `<url><loc>${origin}${p}</loc></url>`).join("")}</urlset>`,
);
console.log(
  `Generated ${publicPaths.length} indexable page heads, confirmation metadata, robots and sitemap for ${origin}.`,
);
