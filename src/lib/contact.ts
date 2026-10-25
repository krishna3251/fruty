import { siteConfig } from "./config";
import { safeEnquiryUrl } from "../data/pickles";
export function enquiryWhatsApp(
  message?: string,
  destination = siteConfig.tropicalFeastDmUrl,
) {
  const base = safeEnquiryUrl(destination);
  if (!base) return null;
  const url = new URL(base);
  if (message) url.searchParams.set("text", message);
  return url.href;
}
export function enquiryEmail(message?: string, email = siteConfig.email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const recipient = encodeURIComponent(email).replace(/%40/gi, "@");
  return `mailto:${recipient}?subject=${encodeURIComponent("Tropical Feast pickle enquiry")}${message ? `&body=${encodeURIComponent(message)}` : ""}`;
}

// Web compose works without a registered mailto handler. Nothing is sent by opening it.
export function enquiryGmail(message?: string, email = siteConfig.email) {
  if (!enquiryEmail(undefined, email)) return null;
  const url = new URL("https://mail.google.com/mail/");
  url.search = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: "Tropical Feast pickle enquiry",
    ...(message ? { body: message } : {}),
  }).toString();
  return url.href;
}
