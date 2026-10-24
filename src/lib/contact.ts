import { siteConfig } from "./config";
import { safeEnquiryUrl } from "../data/pickles";
export function enquiryWhatsApp(message?: string) {
  const base = safeEnquiryUrl(siteConfig.tropicalFeastDmUrl);
  if (!base) return null;
  const url = new URL(base);
  if (message) url.searchParams.set("text", message);
  return url.href;
}
export function enquiryEmail(message?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.email)) return null;
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent("Tropical Feast pickle enquiry")}${message ? `&body=${encodeURIComponent(message)}` : ""}`;
}
