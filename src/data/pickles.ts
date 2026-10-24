// Owner confirmed two flavours and supplied the homepage, logo and product images.
// Owner confirmed ₹200 for each pickle. Jar sizes, ingredients and stock remain unconfirmed.
export type PickleCollectionId = "tropical-feast";
export interface PickleCollection {
  id: PickleCollectionId;
  name: string;
  headline: string;
  description: string;
  tagline: string;
  descriptors: string[];
  promotionalMessages: string[];
  serviceArea: string | null;
  orderMethod: "direct-message" | null;
}
export interface PickleProduct {
  id: string;
  name: string;
  collectionId: PickleCollectionId;
  description: string;
  image: string;
  imageAlt: string;
  imageType: "owner-supplied";
  price: number | null;
  currency: "INR";
  jarSize: string | null;
  ingredients: string[] | null;
  flavourDescriptors: string[];
  availability: "unconfirmed";
  orderMethod: "direct-message" | null;
  serviceArea: string | null;
}
export const brandAssets = {
  hero: "/images/pickles/owner-hero.webp",
  logo: "/images/pickles/owner-logo.webp",
};
export const pickleCollections: PickleCollection[] = [
  {
    id: "tropical-feast",
    name: "Tropical Feast",
    headline: "An American-inspired pickle experience.",
    description:
      "Two flavours. One Tropical Feast: discover golden Pineapple Pickle and green Cucumber Pickle. Crisp, spicy and tangy.",
    tagline: "Rich Flavours, Beautifully Preserved.",
    descriptors: ["Crisp", "Spicy", "Tangy"],
    promotionalMessages: [],
    serviceArea: "Hyderabad only",
    orderMethod: "direct-message",
  },
];
const pending = {
  price: 200,
  currency: "INR",
  jarSize: null,
  ingredients: null,
  availability: "unconfirmed",
  imageType: "owner-supplied",
  collectionId: "tropical-feast",
  flavourDescriptors: ["Crisp", "Spicy", "Tangy"],
  serviceArea: "Hyderabad only",
  orderMethod: "direct-message",
} as const;
export const pickleProducts: PickleProduct[] = [
  {
    ...pending,
    flavourDescriptors: [...pending.flavourDescriptors],
    id: "tropical-pineapple-pickle",
    name: "Pineapple Pickle",
    description:
      "Meet the golden side of Tropical Feast. Pineapple Pickle brings its own character to the table: crisp, spicy and tangy.",
    image: "/images/pickles/pineapple-pickle.webp",
    imageAlt:
      "Tropical Feast Pineapple Pickle jar with golden pineapple chunks, a golden lid and cream pineapple label",
  },
  {
    ...pending,
    flavourDescriptors: [...pending.flavourDescriptors],
    id: "tropical-cucumber-pickle",
    name: "Cucumber Pickle",
    description:
      "Meet the green side of Tropical Feast. Cucumber Pickle brings its own character to the table: crisp, spicy and tangy.",
    image: "/images/pickles/cucumber-pickle.webp",
    imageAlt:
      "Tropical Feast Cucumber Pickle jar with green cucumber slices, a golden lid and cream cucumber label",
  },
];
export const collectionFor = (product: PickleProduct) =>
  pickleCollections.find((c) => c.id === product.collectionId)!;
export function filterPickles(collection: string, query: string) {
  const term = query.trim().toLowerCase();
  return pickleProducts.filter(
    (p) =>
      (collection === "all" || p.collectionId === collection) &&
      `${p.name} ${collectionFor(p).name} ${p.flavourDescriptors.join(" ")}`
        .toLowerCase()
        .includes(term),
  );
}
export function safeEnquiryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
// Preserve a saved cucumber preference from the earlier duplicate entry.
// The removed, unconfirmed vegetable is never converted to a different flavour.
export const retiredPickleRoutes: Record<string, string> = {
  "/collections/fermented-pickles": "/shop",
  "/products/fermented-cucumber-pickle": "/products/tropical-cucumber-pickle",
};
