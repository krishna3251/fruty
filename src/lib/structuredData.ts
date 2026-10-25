import {
  pickleProducts,
  pickleCollections,
  collectionFor,
  type PickleProduct,
} from "../data/pickles";
import { pageMeta } from "./seo";
export function structuredData(
  path: string,
  origin: string,
  catalogue: PickleProduct[] = pickleProducts,
): Record<string, unknown> | null {
  if (!pageMeta(path, catalogue).index) return null;
  const product = catalogue.find((p) => path === `/products/${p.id}`);
  const collection = pickleCollections.find(
    (c) => path === `/collections/${c.id}`,
  );
  const graph: Record<string, unknown>[] = [];
  if (path === "/")
    graph.push({
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: "Tropical Feast",
      alternateName: "Fruty × Tropical Feast",
      inLanguage: "en-IN",
    });
  else {
    const crumbs = [{ name: "Home", item: `${origin}/` }];
    if (product || collection)
      crumbs.push({ name: "Shop pickles", item: `${origin}/shop` });
    crumbs.push({
      name:
        product?.name ||
        collection?.name ||
        (
          {
            "/shop": "Shop pickles",
            "/ordering": "Ordering",
            "/privacy": "Privacy",
            "/terms": "Terms",
            "/contact": "Contact",
            "/shipping": "Shipping & delivery",
            "/returns": "Cancellations & order support",
          } as Record<string, string>
        )[path] ||
        "Pickles",
      item: origin + path,
    });
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        ...c,
      })),
    });
  }
  if (product)
    graph.push({
      "@type": "Product",
      "@id": `${origin}${path}#product`,
      name: product.name,
      description: product.description,
      image: [origin + product.image],
      url: origin + path,
      brand: { "@type": "Brand", name: collectionFor(product).name },
      ...(product.price !== null
        ? {
            offers: {
              "@type": "Offer",
              url: origin + path,
              price: product.price,
              priceCurrency: product.currency,
            },
          }
        : {}),
    });
  return { "@context": "https://schema.org", "@graph": graph };
}
export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
