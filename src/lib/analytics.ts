export type Consent = { version: 1; analytics: boolean; expires: number };
const key = "furity-consent-v1";
let enabled = false;
let measurement = "";
let lastPath = "";
type TrackingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
export function readConsent(): Consent | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value?.version === 1 &&
      typeof value.analytics === "boolean" &&
      typeof value.expires === "number" &&
      value.expires > Date.now()
      ? value
      : null;
  } catch {
    return null;
  }
}
export function saveConsent(analytics: boolean) {
  const value: Consent = {
    version: 1,
    analytics,
    expires: Date.now() + 180 * 86400000,
  };
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Session consent still applies. */
  }
  return value;
}
export function analyticsConfigured(id: string) {
  return /^G-[A-Z0-9]{4,20}$/.test(id);
}
export function startAnalytics(id: string, consent: boolean) {
  if (!analyticsConfigured(id) || !consent) return false;
  if (enabled && measurement === id) return true;
  const w = window as TrackingWindow;
  measurement = id;
  enabled = true;
  Reflect.set(window, `ga-disable-${id}`, false);
  w.dataLayer = w.dataLayer || [];
  w.gtag = (...args) => w.dataLayer!.push(args);
  w.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  w.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  w.gtag("js", new Date());
  w.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 15552000,
  });
  const script = document.createElement("script");
  script.id = "furity-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.onerror = () => {
    enabled = false;
    script.remove();
  };
  document.head.append(script);
  return true;
}
export function stopAnalytics() {
  const wasLoaded = !!document.getElementById("furity-analytics");
  enabled = false;
  lastPath = "";
  if (measurement) Reflect.set(window, `ga-disable-${measurement}`, true);
  (window as TrackingWindow).gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  document.getElementById("furity-analytics")?.remove();
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (/^_ga(?:_|$)/.test(name)) {
      for (const domain of [
        "",
        `;domain=${window.location.hostname}`,
        `;domain=.${window.location.hostname}`,
      ])
        document.cookie = `${name}=;max-age=0;path=/${domain}`;
    }
  }
  return wasLoaded;
}
export function trackPage(path: string, origin: string) {
  if (!enabled || path === lastPath) return false;
  lastPath = path;
  (window as TrackingWindow).gtag?.("event", "page_view", {
    page_location: origin + path,
    page_title: document.title,
  });
  return true;
}
export function trackEvent(
  name: "shop_cta" | "view_item" | "add_to_cart" | "newsletter_success",
  itemId?: string,
) {
  if (!enabled) return;
  (window as TrackingWindow).gtag?.(
    "event",
    name,
    itemId ? { item_id: itemId } : {},
  );
}
