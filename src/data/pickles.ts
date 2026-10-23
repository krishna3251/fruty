// Supplied poster content. Unknown commercial fields intentionally remain null.
export type PickleCollectionId = "fermented-pickles" | "tropical-feast";
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
  imageType: "illustration";
  price: number | null;
  currency: "INR";
  jarSize: string | null;
  ingredients: string[] | null;
  flavourDescriptors: string[];
  availability: "unconfirmed";
  orderMethod: "direct-message" | null;
  serviceArea: string | null;
}
export const pickleCollections: PickleCollection[] = [
  {
    id: "fermented-pickles",
    name: "Fermented Pickles",
    headline: "A naturally tangy point of view.",
    description:
      "Two pickle varieties, presented in golden-lidded glass jars. Meet Cucumber Pickle and a pale vegetable variety whose exact identity is still awaiting confirmation.",
    tagline: "Made for your mindful food moments.",
    descriptors: [],
    promotionalMessages: ["ZERO OIL", "ZERO MASALA"],
    serviceArea: null,
    orderMethod: null,
  },
  {
    id: "tropical-feast",
    name: "Tropical Feast",
    headline: "An American-inspired pickle experience.",
    description:
      "Pineapple and cucumber, each with its own character. Discover two distinct pickle varieties from the Tropical Feast promotional collection.",
    tagline: "Premium Quality. Distinctive Flavours.",
    descriptors: ["Crisp", "Spicy", "Tangy"],
    promotionalMessages: [],
    serviceArea: "Hyderabad only",
    orderMethod: "direct-message",
  },
];
const pending = {
  price: null,
  currency: "INR",
  jarSize: null,
  ingredients: null,
  availability: "unconfirmed",
  imageType: "illustration",
} as const;
export const pickleProducts: PickleProduct[] = [
  {
    ...pending,
    id: "fermented-cucumber-pickle",
    name: "Cucumber Pickle",
    collectionId: "fermented-pickles",
    description:
      "The confirmed cucumber entry in the Fermented Pickles collection. Ingredient list, jar size and commercial details are awaiting the supplier’s confirmation.",
    image: "/images/pickles/fermented-cucumber.svg",
    imageAlt:
      "Illustrative glass jar with cucumber slices and a golden lid; product photograph pending",
    flavourDescriptors: [],
    serviceArea: null,
    orderMethod: null,
  },
  {
    ...pending,
    id: "fermented-pale-vegetable-pickle",
    name: "Pale Vegetable Pickle — variety unconfirmed",
    collectionId: "fermented-pickles",
    description:
      "A second pale vegetable pickle appears in the supplied promotional information. Its exact vegetable variety has not been verified; no ingredient or nutritional details are assumed.",
    image: "/images/pickles/fermented-pale-vegetable.svg",
    imageAlt:
      "Illustrative golden-lidded jar with pale vegetable pieces of unconfirmed variety; product photograph pending",
    flavourDescriptors: [],
    serviceArea: null,
    orderMethod: null,
  },
  {
    ...pending,
    id: "tropical-pineapple-pickle",
    name: "Pineapple Pickle",
    collectionId: "tropical-feast",
    description:
      "The golden pineapple entry from Tropical Feast. The collection’s supplied flavour descriptors are crisp, spicy and tangy. Enquiries are for Hyderabad only.",
    image: "/images/pickles/tropical-pineapple.svg",
    imageAlt:
      "Illustrative pineapple pickle jar with golden chunks, a cream label and a golden lid; product photograph pending",
    flavourDescriptors: ["Crisp", "Spicy", "Tangy"],
    serviceArea: "Hyderabad only",
    orderMethod: "direct-message",
  },
  {
    ...pending,
    id: "tropical-cucumber-pickle",
    name: "Cucumber Pickle",
    collectionId: "tropical-feast",
    description:
      "The green cucumber entry from Tropical Feast, distinct from Fermented Pickles’ cucumber product. The collection’s supplied flavour descriptors are crisp, spicy and tangy. Enquiries are for Hyderabad only.",
    image: "/images/pickles/tropical-cucumber.svg",
    imageAlt:
      "Illustrative Tropical Feast cucumber pickle jar with green slices, a cream label and a golden lid; product photograph pending",
    flavourDescriptors: ["Crisp", "Spicy", "Tangy"],
    serviceArea: "Hyderabad only",
    orderMethod: "direct-message",
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
// Only explicit HTTPS DM URLs are allowed. Website-wide contact settings are
// not silently treated as either collection's seller or ordering account.
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
