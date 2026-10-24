import { readFileSync } from "node:fs";
import { readCatalogue } from "../server/catalogue.js";
import { productHtml } from "../server/productPage.js";
import { pickleProducts } from "../src/data/pickles.js";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || url.pathname.split("/").at(-1);
  let products = pickleProducts;
  let live = true;
  try {
    products = (await readCatalogue()).products;
  } catch {
    live = false;
  }
  const product = products.find((p) => p.id === slug);
  if (!product)
    return new Response(readFileSync("dist/404.html", "utf8"), {
      status: live ? 404 : 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  const origin =
    process.env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app";
  return new Response(
    productHtml(readFileSync("dist/index.html", "utf8"), product, origin),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
