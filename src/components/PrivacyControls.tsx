import { useCallback, useEffect, useState } from "react";
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
export default function PrivacyControls({
  path,
  blocked = false,
}: {
  path: string;
  blocked?: boolean;
}) {
  const configured = analyticsConfigured(siteConfig.analyticsId);
  const [consent, setConsent] = useState(readConsent);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(false);
  const [editing, setEditing] = useState(false);
  const closePreferences = useCallback(() => setOpen(false), []);
  const unobstructed =
    !blocked &&
    !editing &&
    !["/account", "/sign-in", "/sign-up", "/privacy", "/terms"].includes(path);
  useEffect(() => {
    const focus = (event: FocusEvent) => {
      const target =
        event.type === "focusout" ? event.relatedTarget : event.target;
      setEditing(
        target instanceof Element &&
          !!target.closest("form,input,textarea,select"),
      );
    };
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    return () => {
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
    };
  }, []);
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
      if (e.key === "furity-consent-v1" || e.key === null) {
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
      {!consent && !open && unobstructed && (
        <section
          className="consent-banner"
          aria-label={
            configured
              ? "Optional analytics preferences"
              : "Cookies and essential storage"
          }
        >
          <div>
            <h2>
              {configured
                ? "Your visit. Your choice."
                : "Cookies, kept simple."}
            </h2>
            <p>
              {configured
                ? "Optional analytics stays off until you allow it. Essential basket storage and sign-in cookies work independently."
                : "Your basket stays on this device. Signing in uses essential session cookies. Optional analytics is not in use."}
            </p>
            <a href="/privacy">Read the privacy notice</a>
          </div>
          <div className="consent-actions">
            <button onClick={() => decide(false)}>
              {configured ? "Reject optional" : "Got it"}
            </button>
            <button
              onClick={() => {
                setChoice(false);
                setOpen(true);
              }}
            >
              Preferences
            </button>
            {configured && (
              <button onClick={() => decide(true)}>Accept analytics</button>
            )}
          </div>
        </section>
      )}
      {open && (
        <Modal title="Your privacy preferences" onClose={closePreferences}>
          <div className="policy-content cookie-preferences">
            <div className="cookie-category-header">
              <h3>Essential storage</h3>
              <span>Always active</span>
            </div>
            <p>
              Your pickle enquiry list is kept on this device. The archived
              fruit demo also stores its bag, saved fruit and demo receipts
              here. No tracking is needed to shop. Account pages use essential
              Clerk session cookies for sign-in, independently of optional
              analytics.
            </p>
            <div className="cookie-category-header">
              <h3>Analytics</h3>
              <span>{configured ? "Optional" : "Not in use"}</span>
            </div>
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
              Your choice is saved for 180 days when browser storage is
              available, or for this visit otherwise. You can change it here at
              any time. Rejecting analytics keeps sign-in available. Revoking
              active analytics reloads this page to stop its loaded tag.
            </p>
            <div className="cookie-preference-actions">
              <button
                className="button primary"
                onClick={() => decide(configured && choice)}
              >
                Save preferences
              </button>
              {configured && (
                <button
                  className="button cookie-essential-only"
                  onClick={() => decide(false)}
                >
                  Essential only
                </button>
              )}
            </div>
            <a href="/privacy" className="text-link">
              Privacy details
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
