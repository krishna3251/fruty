import { useEffect, useState } from "react";
import Modal from "./Modal";
import { siteConfig } from "../lib/config";
import {
  analyticsConfigured,
  readConsent,
  saveConsent,
  startAnalytics,
  stopAnalytics,
  trackPage,
  trackEvent,
} from "../lib/analytics";
export default function PrivacyControls({ path }: { path: string }) {
  const configured = analyticsConfigured(siteConfig.analyticsId);
  const [consent, setConsent] = useState(readConsent);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(false);
  useEffect(() => {
    if (consent?.analytics && startAnalytics(siteConfig.analyticsId, true)) {
      if (
        trackPage(path, siteConfig.siteUrl.replace(/\/$/, "")) &&
        path.startsWith("/products/")
      )
        trackEvent("view_item", path.slice(10));
    }
  }, [consent, path]);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "furity-consent-v1") {
        const current = readConsent();
        setConsent(current);
        if (!current?.analytics && stopAnalytics()) window.location.reload();
      }
    };
    window.addEventListener("storage", handler);
    const click = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const a = e.target.closest("a");
      if (
        a?.getAttribute("href") === "/shop" ||
        a?.getAttribute("href") === "#shop" ||
        a?.getAttribute("href") === "/pickles"
      )
        trackEvent("shop_cta");
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("storage", handler);
      document.removeEventListener("click", click);
    };
  }, []);
  const decide = (allow: boolean) => {
    setConsent(saveConsent(allow));
    setOpen(false);
    if (!allow && stopAnalytics()) window.location.reload();
  };
  return (
    <>
      <button
        className="privacy-settings"
        onClick={() => {
          setChoice(consent?.analytics || false);
          setOpen(true);
        }}
      >
        Cookie & storage preferences
      </button>
      {configured && !consent && !open && (
        <section
          className="consent-banner"
          aria-label="Optional analytics preferences"
        >
          <div>
            <h2>Your visit. Your choice.</h2>
            <p>
              Optional Google Analytics helps us understand page and product
              use. It stays off until you accept. Shopping storage works
              independently.
            </p>
            <a href="/privacy">Read the privacy notice</a>
          </div>
          <div className="consent-actions">
            <button onClick={() => decide(false)}>Reject optional</button>
            <button
              onClick={() => {
                setChoice(false);
                setOpen(true);
              }}
            >
              Preferences
            </button>
            <button onClick={() => decide(true)}>Accept analytics</button>
          </div>
        </section>
      )}
      {open && (
        <Modal title="Your privacy preferences" onClose={() => setOpen(false)}>
          <div className="policy-content">
            <h3>Shopping storage</h3>
            <p>
              Your pickle enquiry list is kept on this device. The archived
              fruit demo also stores its bag, saved fruit and demo receipts
              here. No tracking is needed to shop. Account pages use essential
              Clerk session cookies for sign-in, independently of optional
              analytics.
            </p>
            {configured ? (
              <label className="consent-choice">
                <input
                  type="checkbox"
                  checked={choice}
                  onChange={(e) => setChoice(e.target.checked)}
                />
                <span>Allow optional Google Analytics</span>
              </label>
            ) : (
              <p>
                No analytics ID is configured. No optional analytics script or
                analytics cookie is loaded.
              </p>
            )}
            <p>
              Preferences expire after 180 days. You can change them here at any
              time. Revoking active analytics reloads this page to stop the
              loaded tag.
            </p>
            <button
              className="button primary"
              onClick={() => decide(configured && choice)}
            >
              Save preferences
            </button>
            <a href="/privacy" className="text-link">
              Privacy details
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
