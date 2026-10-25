import { readCatalogue } from "../server/catalogue.js";
import { cataloguePaths } from "../src/lib/seo.js";
import { escapeHtml } from "../server/productPage.js";
export async function GET() {
  try {
    const { products } = await readCatalogue();
    const origin =
      process.env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app";
    const paths = cataloguePaths(products);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${escapeHtml(origin + p)}</loc></url>`).join("")}</urlset>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "60" },
    });
  }
}
