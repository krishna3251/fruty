import { money } from "../data/products";
import { products } from "../data/products";
import {
  pickleCollections,
  pickleProducts,
  collectionFor,
} from "../data/pickles";
export const publicPaths = [
  "/",
  "/shop",
  ...pickleCollections.map((c) => `/collections/${c.id}`),
  ...pickleProducts.map((p) => `/products/${p.id}`),
  "/ordering",
  "/privacy",
  "/terms",
  "/contact",
];
export const archivePaths = [
  "/fruit-demo",
  "/fruit-story",
  ...products.map((p) => `/products/${p.id}`),
];
export function pageMeta(path: string) {
  if (["/fruit-demo", "/fruit-story"].includes(path))
    return {
      title:
        path === "/fruit-story"
          ? "Archived Fruit Story | Tropical Feast"
          : "Archived Fruit Shop Demo | Tropical Feast",
      description:
        "The retained fruit-store demonstration is archived separately from Tropical Feast’s primary pickle catalogue. No real orders or payments are processed.",
      type: "website",
      index: false,
    };
  const pickle = pickleProducts.find((p) => path === `/products/${p.id}`);
  if (pickle)
    return {
      title: `${pickle.name} | Tropical Feast`,
      description: `Explore Tropical Feast’s ${pickle.name.toLowerCase()}${pickle.price === null ? " — price on enquiry" : ` at ${money(pickle.price)}`}. Enquire in Hyderabad and confirm jar size, ingredients, availability and delivery.`,
      type: "website",
      index: true,
    };
  const collection = pickleCollections.find(
    (c) => path === `/collections/${c.id}`,
  );
  if (collection)
    return {
      title: `${collection.name} | Pickle Collection`,
      description: collection.description,
      type: "website",
      index: true,
    };
  const product = products.find((p) => path === `/products/${p.id}`);
  if (product)
    return {
      title: `${product.name} | Archived Fruit Demo | Tropical Feast`,
      description: `Explore ${product.name.toLowerCase()}, ${product.weight}, from ${product.origin}. Read storage tips and browse the furity sample fruit collection.`,
      type: "website",
      index: false,
    };
  const pages: Record<string, { title: string; description: string }> = {
    "/pickles": {
      title: "Two Pickle Flavours | Tropical Feast",
      description:
        "Explore pineapple and cucumber pickles from Tropical Feast, with owner-supplied product images and clear enquiry details.",
    },
    "/": {
      title: "Fermented Pickles | The Pineapple Jar Story",
      description:
        "Scroll through a pineapple pickle product film at Fermented Pickles. Discover Tropical Feast’s pineapple and cucumber flavours and prepare an enquiry.",
    },
    "/shop": {
      title: "Shop Pineapple & Cucumber Pickles | Tropical Feast",
      description:
        "Browse both Tropical Feast pickle flavours: pineapple and cucumber. Compare product details and save a list for enquiries.",
    },
    "/ordering": {
      title: "How to Order & Enquire | Tropical Feast",
      description:
        "Learn how to save a pickle enquiry list, check supplier channel availability and confirm prices, ingredients and delivery. Hyderabad-only applies to Tropical Feast.",
    },
    "/privacy": {
      title: "Privacy & Browser Storage | Tropical Feast",
      description:
        "Learn what the Tropical Feast catalogue stores on your device, how optional analytics consent works, and how newsletter and checkout information is handled.",
    },
    "/terms": {
      title: "Website Terms & Enquiry Conditions | Tropical Feast",
      description:
        "Read the conditions for using the Tropical Feast pickle enquiry catalogue, including unconfirmed product details, enquiry limitations and owner details required before launch.",
    },
    "/contact": {
      title: "Contact & Business Information | Tropical Feast",
      description:
        "Find configured Tropical Feast business contact details and the status of customer support, delivery and commercial launch information.",
    },
  };
  if (pages[path]) return { ...pages[path], type: "website", index: true };
  return {
    title:
      path === "/thank-you"
        ? "Newsletter Confirmation | Tropical Feast"
        : "Page Not Found | Tropical Feast",
    description:
      path === "/thank-you"
        ? "Check the status of your newsletter submission."
        : "That page could not be found. Return to the Tropical Feast pickle collection.",
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
