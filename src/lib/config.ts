const env = import.meta.env || {};
export const siteConfig = {
  siteUrl: env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app",
  businessName: env.VITE_BUSINESS_NAME || "",
  email: env.VITE_CONTACT_EMAIL || "",
  phone: env.VITE_CONTACT_PHONE || "",
  address: env.VITE_CONTACT_ADDRESS || "",
  analyticsId: env.VITE_GA_MEASUREMENT_ID || "",
  newsletterEndpoint: env.VITE_NEWSLETTER_ENDPOINT || "",
};
