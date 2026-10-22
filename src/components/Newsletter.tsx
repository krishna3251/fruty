import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "../lib/config";
import { navigate } from "../hooks/useRoute";
import { trackEvent } from "../lib/analytics";
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending.current) return;
        setError("");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("Enter a valid email address, like name@example.com.");
          return;
        }
        let endpoint: URL;
        try {
          endpoint = new URL(siteConfig.newsletterEndpoint);
          if (endpoint.protocol !== "https:") throw Error();
        } catch {
          setError(
            "Newsletter signup is not available yet. Your email has not been submitted.",
          );
          return;
        }
        pending.current = true;
        setBusy(true);
        controller.current = new AbortController();
        const timer = setTimeout(() => controller.current?.abort(), 12000);
        try {
          const result = await fetch(endpoint.href, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",
            body: JSON.stringify({ email: email.trim() }),
            signal: controller.current.signal,
          });
          const data = await result.json();
          if (!result.ok || data?.subscribed !== true) throw Error();
          try {
            sessionStorage.setItem(
              "furity-newsletter-confirmed",
              String(Date.now()),
            );
          } catch {
            setError(
              "Signup was confirmed, but this browser could not open the confirmation page.",
            );
            return;
          }
          trackEvent("newsletter_success");
          navigate("/thank-you");
        } catch {
          setError(
            "We couldn’t confirm your signup. Check your connection and try again; your email is still here.",
          );
        } finally {
          clearTimeout(timer);
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Your email address
      </label>
      <div className="newsletter-input">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="newsletter-status"
          disabled={busy}
        />
        <button aria-label="Join newsletter" disabled={busy}>
          {busy ? (
            <span aria-label="Submitting" className="small-spinner" />
          ) : (
            <ArrowRight size={23} />
          )}
        </button>
      </div>
      <small id="newsletter-status" role="status">
        {error ||
          (siteConfig.newsletterEndpoint
            ? "Subscribe for seasonal updates. Read our privacy notice before submitting."
            : "Signup is not connected yet. No email will be submitted.")}
      </small>
      <a href="/privacy" className="newsletter-privacy">
        How we handle your information
      </a>
    </form>
  );
}
