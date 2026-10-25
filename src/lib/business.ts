export const businessDefaults = {
  name: "Tropical Feast",
  email: "tropicalfeast7@gmail.com",
  whatsapp: "919398152226", // Verified by the owner in the existing conversation.
  instagram: "https://www.instagram.com/tropicalfeast.pickles/",
  tagline: "Rich flavours, beautifully preserved",
  hours: "Monday–Saturday, 11 AM–8 PM · Sunday closed",
  location: "Hyderabad, Telangana, India",
  areas: [] as { name: string; pins: string[]; rate: number | null }[],
  freeDeliveryThreshold: null as number | null,
  deliveryEstimate: "", // No unverified delivery promise.
};
export type BusinessSettings = typeof businessDefaults;
export const DELIVERY_NOTICE =
  "Delivery charges will be confirmed on WhatsApp.";
