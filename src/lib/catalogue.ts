import { pickleProducts, type PickleProduct } from "../data/pickles.js";
export const DELIVERY_CHARGE: number | null = null; // Confirmed by location, never a universal fee.
export function cartTotals(
  products: PickleProduct[],
  quantities: Record<string, number>,
) {
  const subtotal = products.reduce(
    (n, p) => n + (p.price ?? 0) * (quantities[p.id] || 1),
    0,
  );
  const delivery = products.length ? DELIVERY_CHARGE : 0;
  return {
    subtotal,
    delivery,
    total: delivery === null ? null : subtotal + delivery,
  };
}
export function validateProduct(value: unknown): PickleProduct {
  if (!value || typeof value !== "object")
    throw Error("Product details are required.");
  const p = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    const v = p[key];
    if (
      typeof v !== "string" ||
      v.trim().length < min ||
      v.trim().length > max ||
      /[<>\u0000-\u001f]/.test(v)
    )
      throw Error(`Check ${key}: use ${min}–${max} plain-text characters.`);
    return v.trim();
  };
  const id = text("id", 3, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw Error("Use a lowercase product slug with hyphens.");
  const image = text("image", 1, 160);
  if (
    !pickleProducts.some((p) => p.image === image) &&
    !/^\/api\/product-image\?id=[a-f0-9-]{36}$/.test(image)
  )
    throw Error("Upload a product photo first.");
  if (
    typeof p.price !== "number" ||
    !Number.isFinite(p.price) ||
    p.price <= 0 ||
    p.price > 100000 ||
    Math.abs(Math.round(p.price * 100) - p.price * 100) > 0.000001
  )
    throw Error(
      "Enter a valid price between ₹0.01 and ₹100,000, with up to two decimals.",
    );
  const availability = p.availability;
  if (
    !["unconfirmed", "available", "unavailable"].includes(
      availability as string,
    )
  )
    throw Error("Choose an availability status.");
  return {
    id,
    name: text("name", 3, 100),
    description: text("description", 10, 1200),
    image,
    imageAlt: text("imageAlt", 5, 240),
    price: p.price,
    jarSize: p.jarSize ? text("jarSize", 1, 80) : null,
    ingredients:
      Array.isArray(p.ingredients) && p.ingredients.length
        ? p.ingredients
            .map((v) => {
              if (
                typeof v !== "string" ||
                v.length > 100 ||
                /[<>\u0000-\u001f]/.test(v)
              )
                throw Error("Check the ingredient list.");
              return v.trim();
            })
            .filter(Boolean)
            .slice(0, 40)
        : null,
    flavourDescriptors: Array.isArray(p.flavourDescriptors)
      ? p.flavourDescriptors
          .filter(
            (v): v is string =>
              typeof v === "string" &&
              v.length <= 30 &&
              !/[<>\u0000-\u001f]/.test(v),
          )
          .slice(0, 8)
      : [],
    stockQuantity:
      p.stockQuantity == null
        ? null
        : (() => {
            if (
              typeof p.stockQuantity !== "number" ||
              !Number.isInteger(p.stockQuantity) ||
              p.stockQuantity < 0 ||
              p.stockQuantity > 100000
            )
              throw Error("Enter a verified nonnegative stock quantity.");
            return p.stockQuantity;
          })(),
    availability: availability as PickleProduct["availability"],
    collectionId: "tropical-feast",
    currency: "INR",
    imageType: "owner-supplied",
    orderMethod: "direct-message",
    serviceArea: "Hyderabad only",
  };
}
