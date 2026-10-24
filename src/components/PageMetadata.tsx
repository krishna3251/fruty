import { useCatalogue } from "../context/Catalogue";
import { useEffect } from "react";
import { pageMeta, safeOrigin } from "../lib/seo";
import { structuredData, serializeStructuredData } from "../lib/structuredData";
import { siteConfig } from "../lib/config";
export default function PageMetadata({ path }: { path: string }) {
  const { products } = useCatalogue();
  useEffect(() => {
    const m = pageMeta(path, products);
    let origin: string;
    try {
      origin = safeOrigin(siteConfig.siteUrl);
    } catch {
      origin = window.location.origin;
    }
    document.title = m.title;
    const meta = (key: string, value: string, property = false) => {
      const attribute = property ? "property" : "name";
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, key);
        document.head.append(el);
      }
      el.content = value;
    };
    meta("description", m.description);
    meta("robots", m.index ? "index,follow" : "noindex,follow");
    meta("og:site_name", "Fermented Pickles", true);
    meta("og:title", m.title, true);
    meta("og:description", m.description, true);
    meta("og:url", origin + path, true);
    meta("og:type", "website", true);
    meta("og:image", origin + "/social-card.png", true);
    meta("twitter:card", "summary_large_image");
    meta("twitter:title", m.title);
    meta("twitter:description", m.description);
    meta("twitter:image", origin + "/social-card.png");
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = origin + path;
    document.getElementById("page-structured-data")?.remove();
    const data = structuredData(path, origin, products);
    if (data) {
      const script = document.createElement("script");
      script.id = "page-structured-data";
      script.type = "application/ld+json";
      script.textContent = serializeStructuredData(data);
      document.head.append(script);
    }
  }, [path, products]);
  return null;
}
