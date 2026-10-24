import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import {
  clerkPublishableKey,
  validClerkPublishableKey,
} from "../lib/authConfig";
const ClerkAccount = lazy(() => import("./ClerkAccount"));
export type AccountMode = "sign-in" | "sign-up" | "account";
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
      <a href="/shop">
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
  return (
    <section className="account-page section-pad">
      <div className="account-intro">
        <span className="eyebrow">FERMENTED PICKLES / YOUR ACCOUNT</span>
        <h1>
          {mode === "sign-up"
            ? "Make yourself at home."
            : mode === "account"
              ? "Your little corner of the pantry."
              : "Welcome back."}
        </h1>
        <p>
          Manage your sign-in and profile securely. You can always browse the
          two flavours and send an enquiry as a guest.
        </p>
        <span className="account-trust">
          <ShieldCheck size={17} /> Authentication powered by Clerk
        </span>
        <a className="text-link" href="/shop">
          Back to the pantry <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="account-surface">
        {validClerkPublishableKey(clerkPublishableKey) ? (
          <AccountBoundary>
            <AccountConnection mode={mode} />
          </AccountBoundary>
        ) : (
          <div className="account-unavailable" role="status">
            <h2>Accounts aren’t available here yet.</h2>
            <p>
              The authentication connection is not configured for this
              environment. You can still browse and enquire as a guest.
            </p>
            <a className="button primary" href="/shop">
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
