import { products } from "../data/products";
import {
  pickleCollections,
  pickleProducts,
  collectionFor,
} from "../data/pickles";
export const publicPaths = [
  "/",
  "/shop",
  "/pickles",
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
          ? "Archived Fruit Story | Fruity"
          : "Archived Fruit Shop Demo | Fruity",
      description:
        "The retained fruit-store demonstration is archived separately from Fruity’s primary pickle catalogue. No real orders or payments are processed.",
      type: "website",
      index: false,
    };
  const pickle = pickleProducts.find((p) => path === `/products/${p.id}`);
  if (pickle)
    return {
      title:
        pickle.id === "fermented-pale-vegetable-pickle"
          ? "Pale Vegetable Pickle (Unconfirmed) | Fermented Pickles | Fruity"
          : `${pickle.name} | ${collectionFor(pickle).name} | Fruity`,
      description: `${pickle.description} Price, jar size and availability awaiting confirmation.`,
      type: "website",
      index: true,
    };
  const collection = pickleCollections.find(
    (c) => path === `/collections/${c.id}`,
  );
  if (collection)
    return {
      title: `${collection.name} | Pickle Collection | Fruity`,
      description: collection.description,
      type: "website",
      index: true,
    };
  const product = products.find((p) => path === `/products/${p.id}`);
  if (product)
    return {
      title: `${product.name} | Archived Fruit Demo | Fruity`,
      description: `Explore ${product.name.toLowerCase()}, ${product.weight}, from ${product.origin}. Read storage tips and browse the furity sample fruit collection.`,
      type: "website",
      index: false,
    };
  const pages: Record<string, { title: string; description: string }> = {
    "/pickles": {
      title: "Pickles | Fermented Pickles & Tropical Feast | Fruity",
      description:
        "Discover four pickle entries across Fermented Pickles and Tropical Feast. Explore cucumber, pineapple and an unconfirmed pale vegetable variety, with clear enquiry details.",
    },
    "/": {
      title: "Fruity | Distinctive Pickles & Pantry Collections",
      description:
        "Discover Fermented Pickles and Tropical Feast at Fruity. Explore cucumber and pineapple pickle varieties, save your favourites and find collection-specific enquiry details.",
    },
    "/shop": {
      title: "Shop Pickles | The Fruity Pantry",
      description:
        "Browse all four pickle entries from Fermented Pickles and Tropical Feast. Filter by collection, compare product details and save a list for supplier enquiries.",
    },
    "/ordering": {
      title: "How to Order & Enquire | Fruity Pickles",
      description:
        "Learn how to save a pickle enquiry list, check supplier channel availability and confirm prices, ingredients and delivery. Hyderabad-only applies to Tropical Feast.",
    },
    "/privacy": {
      title: "Privacy & Browser Storage | Fruity",
      description:
        "Learn what the Fruity catalogue stores on your device, how optional analytics consent works, and how newsletter and checkout information is handled.",
    },
    "/terms": {
      title: "Website Terms & Enquiry Conditions | Fruity",
      description:
        "Read the conditions for using the Fruity pickle enquiry catalogue, including unconfirmed product details, enquiry limitations and owner details required before launch.",
    },
    "/contact": {
      title: "Contact & Business Information | Fruity",
      description:
        "Find configured Fruity business contact details and the status of customer support, delivery and commercial launch information.",
    },
  };
  if (pages[path]) return { ...pages[path], type: "website", index: true };
  return {
    title:
      path === "/thank-you"
        ? "Newsletter Confirmation | Fruity"
        : "Page Not Found | Fruity",
    description:
      path === "/thank-you"
        ? "Check the status of your newsletter submission."
        : "That page could not be found. Return to the Fruity pickle collection.",
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
