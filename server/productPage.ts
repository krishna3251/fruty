import type { PickleProduct } from "../src/data/pickles.js";
export const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export function productHtml(
  shell: string,
  product: PickleProduct,
  origin: string,
) {
  const title = `${product.name} | Tropical Feast`;
  const description = product.description.slice(0, 180);
  const url = `${origin}/products/${product.id}`;
  const safe = escapeHtml;
  const cleaned = shell
    .replace(/<title>.*?<\/title>/gs, "")
    .replace(
      /<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,
      "",
    )
    .replace(/<link rel="canonical"[^>]*>/g, "")
    .replace(/<script id="page-structured-data"[^>]*>.*?<\/script>/gs, "")
    .replace(/<noscript>.*?<\/noscript>/gs, "");
  const tags = `<title>${safe(title)}</title><meta name="description" content="${safe(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${safe(url)}"><meta property="og:title" content="${safe(title)}"><meta property="og:description" content="${safe(description)}"><meta property="og:url" content="${safe(url)}"><meta property="og:type" content="website"><meta property="og:image" content="${safe(origin + product.image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${safe(title)}"><meta name="twitter:description" content="${safe(description)}"><meta name="twitter:image" content="${safe(origin + product.image)}">`;
  const graph = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [origin + product.image],
    url,
    brand: { "@type": "Brand", name: "Tropical Feast" },
    ...(product.price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "INR",
            url,
          },
        }
      : {}),
  };
  const schema = `<script id="page-structured-data" type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>`;
  const fallback = `<noscript><main class="pantry-store information-page section-pad"><a href="/shop">Back to the pantry</a><h1>${safe(product.name)}</h1><img src="${safe(product.image)}" alt="${safe(product.imageAlt)}" width="300" height="200"><p>${safe(product.description)}</p><p>${product.price === null ? "Price on enquiry" : `₹${product.price}`} · ₹150 standard delivery · coverage confirmed on WhatsApp · Hyderabad only.</p><p>${product.availability === "unavailable" ? "Currently unavailable." : "Confirm stock, jar size, ingredients and allergens before ordering."}</p><a href="/ordering">Ordering information</a></main></noscript>`;
  return cleaned
    .replace("</head>", tags + schema + "</head>")
    .replace("</body>", fallback + "</body>");
}
