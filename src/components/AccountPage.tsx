import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useSession, rememberGuest } from "../context/Session";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import {
  clerkPublishableKey,
  validClerkPublishableKey,
} from "../lib/authConfig";
const ClerkAccount = lazy(() => import("./ClerkAccount"));
export type AccountMode = "sign-in" | "sign-up" | "account" | "admin";
class AccountBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <AccountUnavailable /> : this.props.children;
  }
}
function AccountUnavailable() {
  return (
    <div className="account-unavailable" role="alert">
      <h2>Account service unavailable.</h2>
      <p>
        We couldn’t connect securely. Please try again, or continue browsing and
        enquire as a guest.
      </p>
      <button
        className="button primary"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
      <a href="/shop" onClick={rememberGuest}>
        Continue as a guest <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
function AccountConnection({ mode }: { mode: AccountMode }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setTimedOut(true), 20000);
    return () => window.clearTimeout(timer);
  }, [ready]);
  if (timedOut) return <AccountUnavailable />;
  return (
    <Suspense fallback={<p role="status">Connecting securely…</p>}>
      <ClerkAccount mode={mode} onReady={onReady} />
    </Suspense>
  );
}
export default function AccountPage({ mode }: { mode: AccountMode }) {
  const session = useSession();
  return (
    <section
      className={`account-page section-pad ${mode === "admin" ? "admin-page" : ""}`}
    >
      <div className="account-intro">
        <span className="eyebrow">TROPICAL FEAST / YOUR ACCOUNT</span>
        <h1>
          {mode === "admin"
            ? "Your private pantry."
            : mode === "sign-up"
              ? "Make yourself at home."
              : mode === "account"
                ? "Your account."
                : "Welcome back."}
        </h1>
        <p>
          {mode === "admin"
            ? "Sign in with the verified owner account to manage products, photos, prices and availability."
            : "Sign in to manage your profile. Browsing and enquiries are always available to guests."}
        </p>
        <span className="account-trust">
          <ShieldCheck size={17} /> Authentication powered by Clerk
        </span>
        <a
          className="text-link"
          href="/shop"
          onClick={() => {
            if (session.status !== "signed-in") rememberGuest();
          }}
        >
          {session.status === "signed-in"
            ? "Back to the pantry"
            : "Continue as a guest"}{" "}
          <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="account-surface">
        {validClerkPublishableKey(clerkPublishableKey) &&
        session.status !== "unavailable" ? (
          <AccountBoundary>
            <AccountConnection mode={mode} />
          </AccountBoundary>
        ) : validClerkPublishableKey(clerkPublishableKey) ? (
          <AccountUnavailable />
        ) : (
          <div className="account-unavailable" role="status">
            <h2>Accounts aren’t available here yet.</h2>
            <p>
              The authentication connection is not configured for this
              environment. You can still browse and enquire as a guest.
            </p>
            <a className="button primary" href="/shop" onClick={rememberGuest}>
              Explore pickles
            </a>
          </div>
        )}
      </div>
      {clerkPublishableKey.startsWith("pk_test_") && (
        <p className="account-environment" role="status">
          Account sign-in is in testing while production setup is completed.
        </p>
      )}
      <p className="account-privacy">
        Signing in uses essential session cookies. Optional analytics
        preferences stay separate. <a href="/privacy">Privacy & storage</a>
      </p>
    </section>
  );
}
