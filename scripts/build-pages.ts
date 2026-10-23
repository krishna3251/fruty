import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadEnv } from "vite";
import {
  pageMeta,
  publicPaths,
  archivePaths,
  safeOrigin,
} from "../src/lib/seo.ts";
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
for (const path of [...publicPaths, ...archivePaths, "/thank-you"]) {
  const m = pageMeta(path);
  let html = base
    .replace(/<title>.*?<\/title>/s, "")
    .replace(/<meta\s+name="description"[^>]*>/s, "");
  const url = origin + path;
  const tags = `<title>${escape(m.title)}</title><meta name="description" content="${escape(m.description)}"><meta name="robots" content="${m.index ? "index,follow" : "noindex,follow"}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Fruity"><meta property="og:image" content="${origin}/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Fruity — The pickle pantry"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(m.title)}"><meta name="twitter:description" content="${escape(m.description)}"><meta name="twitter:image" content="${origin}/social-card.png">`;
  html = html.replace("</head>", tags + "</head>");
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
