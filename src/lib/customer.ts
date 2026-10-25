import type { PickleProduct } from "../data/pickles.js";
import {
  businessDefaults,
  STANDARD_DELIVERY_CHARGE,
  type BusinessSettings,
} from "./business.js";
export const orderStatuses = [
  "enquiry_initiated",
  "awaiting_confirmation",
  "confirmed",
  "preparing",
  "dispatched",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type CartItems = Record<string, number>;
export type Address = {
  id?: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
  instructions?: string;
};
export const emptyAddress: Address = {
  label: "Home",
  recipient: "",
  phone: "",
  street: "",
  locality: "",
  city: "Hyderabad",
  state: "Telangana",
  pin: "",
  isDefault: false,
};
export function plain(value: unknown, label: string, min = 1, max = 150) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    /[<>\u0000-\u001f]/.test(value)
  )
    throw Error(`Check ${label}.`);
  return value.trim();
}
export function uuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  );
}
export function validateAddress(value: unknown): Address {
  if (!value || typeof value !== "object")
    throw Error("Enter delivery details.");
  const a = value as Record<string, unknown>;
  const phone = plain(a.phone, "phone", 10, 16).replace(/[ +()-]/g, "");
  if (!/^(91)?[6-9][0-9]{9}$/.test(phone))
    throw Error("Enter a valid Indian mobile number.");
  const pin = plain(a.pin, "PIN code", 6, 6);
  if (!/^5\d{5}$/.test(pin))
    throw Error(
      "Enter a six-digit Hyderabad-area PIN code; coverage must be confirmed.",
    );
  if (
    String(a.city).trim().toLowerCase() !== "hyderabad" ||
    String(a.state).trim().toLowerCase() !== "telangana"
  )
    throw Error(
      "Delivery enquiries are currently for Hyderabad, Telangana only.",
    );
  if (a.id && !uuid(a.id)) throw Error("Invalid address reference.");
  return {
    ...(a.id ? { id: a.id as string } : {}),
    label: plain(a.label, "address label", 1, 30),
    recipient: plain(a.recipient, "recipient name", 2, 100),
    phone,
    street: plain(a.street, "street address", 5, 250),
    locality: plain(a.locality, "locality", 2, 100),
    city: "Hyderabad",
    state: "Telangana",
    pin,
    isDefault: a.isDefault === true,
    ...(a.instructions
      ? { instructions: plain(a.instructions, "delivery instructions", 1, 300) }
      : {}),
  };
}
export function validateCart(
  value: unknown,
  products: PickleProduct[],
): CartItems {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length > 100
  )
    throw Error("Check the cart items.");
  const out: CartItems = {};
  for (const [id, q] of Object.entries(value)) {
    const p = products.find((p) => p.id === id);
    if (
      !p ||
      p.price === null ||
      p.availability === "unavailable" ||
      p.stockQuantity === 0
    )
      throw Error("An item is no longer available. Review your cart.");
    if (
      !Number.isInteger(q) ||
      typeof q !== "number" ||
      q < 1 ||
      q > 99 ||
      (p.stockQuantity != null && q > p.stockQuantity)
    )
      throw Error("Check quantities against the current product availability.");
    out[id] = q;
  }
  return out;
}
export function validateSettings(value: unknown): BusinessSettings {
  if (!value || typeof value !== "object")
    throw Error("Check business settings.");
  const s = value as BusinessSettings;
  const email = plain(s.email, "email", 5, 150);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw Error("Check the contact email.");
  const whatsapp = plain(s.whatsapp, "WhatsApp number", 10, 15);
  if (!/^91[6-9][0-9]{9}$/.test(whatsapp))
    throw Error("Use a verified Indian WhatsApp number including 91.");
  const instagram = plain(s.instagram, "Instagram link", 1, 200);
  if (!/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagram))
    throw Error("Use a valid Instagram profile URL.");
  if (!Array.isArray(s.areas) || s.areas.length > 100)
    throw Error("Check delivery areas.");
  const amount = (v: unknown) =>
    v === null ||
    (typeof v === "number" &&
      Number.isFinite(v) &&
      v >= 0 &&
      v <= 100000 &&
      Number.isInteger(Math.round(v * 100)) &&
      Math.abs(Math.round(v * 100) - v * 100) < 1e-6);
  if (!amount(s.freeDeliveryThreshold))
    throw Error("Check free delivery threshold.");
  return {
    name: plain(s.name, "business name", 2, 100),
    email,
    whatsapp,
    instagram,
    tagline: plain(s.tagline, "tagline", 2, 150),
    hours: plain(s.hours, "hours", 2, 150),
    location: businessDefaults.location,
    deliveryEstimate: s.deliveryEstimate
      ? plain(s.deliveryEstimate, "delivery estimate", 1, 120)
      : "",
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    areas: s.areas.map((a) => {
      if (
        !Array.isArray(a.pins) ||
        !a.pins.length ||
        a.pins.length > 100 ||
        a.pins.some((p) => !/^5\d{5}$/.test(p)) ||
        !amount(a.rate)
      )
        throw Error(
          "Each delivery area needs valid PIN codes and an optional nonnegative rate.",
        );
      return {
        name: plain(a.name, "area name", 2, 100),
        pins: [...new Set(a.pins)],
        rate: a.rate,
      };
    }),
  };
}
export function deliveryQuote(
  settings: BusinessSettings,
  pin: string,
  subtotal: number,
) {
  const area = settings.areas.find((a) => a.pins.includes(pin));
  if (!area)
    return {
      delivery: STANDARD_DELIVERY_CHARGE,
      total: Math.round((subtotal + STANDARD_DELIVERY_CHARGE) * 100) / 100,
      coverage: "unconfirmed" as const,
    };
  const delivery =
    settings.freeDeliveryThreshold !== null &&
    subtotal >= settings.freeDeliveryThreshold
      ? 0
      : (area.rate ?? STANDARD_DELIVERY_CHARGE);
  return {
    delivery,
    total:
      delivery === null ? null : Math.round((subtotal + delivery) * 100) / 100,
    coverage: "configured" as const,
  };
}
export function snapshotItems(items: CartItems, products: PickleProduct[]) {
  const valid = validateCart(items, products);
  if (!Object.keys(valid).length)
    throw Error("Add a jar before reviewing an enquiry.");
  return Object.entries(valid).map(([id, quantity]) => {
    const p = products.find((p) => p.id === id)!;
    return { id, name: p.name, jarSize: p.jarSize, price: p.price!, quantity };
  });
}
export function orderMessage(order: {
  reference: string;
  customer: Address;
  items: ReturnType<typeof snapshotItems>;
  subtotal: number;
  delivery?: number | null;
}) {
  const a = order.customer;
  return [
    "TROPICAL FEAST — NEW ORDER REQUEST",
    ...order.items.map(
      (i) =>
        `• ${i.quantity} × ${i.name} (${i.jarSize || "size to confirm"}) — ₹${i.price} each · Line total ₹${Math.round(i.price * i.quantity * 100) / 100}`,
    ),
    `Products subtotal: ₹${order.subtotal}`,
    `Name: ${a.recipient}`,
    `Phone: ${a.phone}`,
    `Delivery location: ${a.street}, ${a.locality}, ${a.city}, ${a.state} ${a.pin}`,
    `Delivery: ₹${order.delivery ?? STANDARD_DELIVERY_CHARGE}`,
    `Estimated total: ₹${Math.round((order.subtotal + (order.delivery ?? STANDARD_DELIVERY_CHARGE)) * 100) / 100}`,
    ...(a.instructions ? [`Delivery instructions: ${a.instructions}`] : []),
    `Enquiry reference: ${order.reference}`,
    "Please confirm availability, ingredients/allergens, delivery coverage, the final amount and how payment should be completed. This enquiry is not a confirmed order.",
  ].join("\n");
}
export type OrderItem = ReturnType<typeof snapshotItems>[number];
export interface StoreOrder {
  id: string;
  reference: string;
  customer: Address;
  items: OrderItem[];
  subtotal: string | number;
  delivery: string | number | null;
  total: string | number | null;
  status: OrderStatus;
  payment_method: string;
  payment_status: "unpaid" | "paid" | "refunded";
  version: number;
  created_at: string;
  history: { status: OrderStatus; at: string; delivery?: number | null }[];
}
