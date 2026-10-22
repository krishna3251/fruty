import { products } from "../data/products";
export const publicPaths = [
  "/",
  "/shop",
  ...products.map((p) => `/products/${p.id}`),
  "/privacy",
  "/terms",
  "/contact",
];
export function pageMeta(path: string) {
  const product = products.find((p) => path === `/products/${p.id}`);
  if (product)
    return {
      title: `${product.name} | Seasonal Fruit Selection | furity`,
      description: `Explore ${product.name.toLowerCase()}, ${product.weight}, from ${product.origin}. Read storage tips and browse the furity sample fruit collection.`,
      type: "website",
      index: true,
    };
  const pages: Record<string, { title: string; description: string }> = {
    "/": {
      title: "furity | Seasonal Fruit, Freshness in Full Color",
      description:
        "Explore furity’s colorful seasonal fruit collection, from golden mangoes to fresh berries. Discover origins, storage tips and a thoughtful fruit-shopping demo.",
    },
    "/shop": {
      title: "Shop Seasonal Fruit | Mangoes, Berries & Citrus | furity",
      description:
        "Browse mangoes, strawberries, blueberries and citrus. Compare sample INR prices, explore fruit details and save your favorites in the furity market.",
    },
    "/privacy": {
      title: "Privacy & Browser Storage | furity",
      description:
        "Learn what the furity demo stores on your device, how optional analytics consent works, and how newsletter and checkout information is handled.",
    },
    "/terms": {
      title: "Website Terms & Demo Shopping Conditions | furity",
      description:
        "Read the conditions for using the furity demonstration storefront, including sample products, checkout limitations and owner details required before launch.",
    },
    "/contact": {
      title: "Contact & Business Information | furity",
      description:
        "Find configured furity business contact details and the status of customer support, delivery and commercial launch information.",
    },
  };
  if (pages[path]) return { ...pages[path], type: "website", index: true };
  return {
    title:
      path === "/thank-you"
        ? "Newsletter Confirmation | furity"
        : "Page Not Found | furity",
    description:
      path === "/thank-you"
        ? "Check the status of your newsletter submission."
        : "That page could not be found. Return to the furity fruit collection.",
    type: "website",
    index: false,
  };
}
export function safeOrigin(value: string) {
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error(
      "VITE_PUBLIC_SITE_URL must be an absolute HTTP(S) origin with no path, credentials, query or fragment.",
    );
  return url.origin;
}
