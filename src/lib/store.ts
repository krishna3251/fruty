import { products } from "../data/products";
export type CheckoutFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
};
export function validateCheckout(fields: CheckoutFields) {
  const errors: Partial<Record<keyof CheckoutFields, string>> = {};
  if (fields.name.trim().length < 2)
    errors.name = "Enter your full name (at least 2 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    errors.email = "Enter a valid email address, like name@example.com.";
  if (!/^[6-9]\d{9}$/.test(fields.phone.replace(/[\s-]/g, "")))
    errors.phone = "Enter a 10-digit Indian mobile number starting with 6–9.";
  if (fields.address.trim().length < 8)
    errors.address = "Add a house number and street (at least 8 characters).";
  if (fields.city.trim().length < 2) errors.city = "Enter your city.";
  if (!/^[1-9]\d{5}$/.test(fields.pin.trim()))
    errors.pin = "Enter a valid 6-digit Indian PIN code.";
  return errors;
}
export function estimate(subtotal: number, coupon: string) {
  const discount =
    coupon === "FRESH10" ? Math.min(150, Math.round(subtotal * 0.1)) : 0;
  const delivery = subtotal > 0 && subtotal < 799 ? 49 : 0;
  return {
    subtotal,
    discount,
    delivery,
    total: Math.max(0, subtotal - discount + delivery),
  };
}
export function restoreWishlist(raw: string | null): string[] {
  try {
    const ids: unknown = JSON.parse(raw || "[]");
    return Array.isArray(ids)
      ? [
          ...new Set(
            ids.filter(
              (id): id is string =>
                typeof id === "string" && products.some((p) => p.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export type DemoReceipt = {
  id: string;
  created: string;
  total: number;
  items: { id: string; quantity: number }[];
};
export function restoreReceipts(raw: string | null): DemoReceipt[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (r): r is DemoReceipt =>
          !!r &&
          typeof r === "object" &&
          typeof r.id === "string" &&
          r.id.startsWith("DEMO-") &&
          typeof r.created === "string" &&
          Number.isFinite(Date.parse(r.created)) &&
          Number.isFinite(r.total) &&
          r.total >= 0 &&
          Array.isArray(r.items) &&
          r.items.every(
            (i: unknown) =>
              !!i &&
              typeof i === "object" &&
              "id" in i &&
              "quantity" in i &&
              products.some((p) => p.id === i.id) &&
              Number.isInteger(i.quantity) &&
              Number(i.quantity) > 0 &&
              Number(i.quantity) <= 20,
          ),
      )
      .slice(0, 10);
  } catch {
    return [];
  }
}
