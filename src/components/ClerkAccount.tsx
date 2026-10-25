import { useEffect, useState, useRef } from "react";
import { SignIn, SignUp, UserProfile, useClerk, useUser } from "@clerk/react";
import PasswordRecovery from "./PasswordRecovery";
import CustomerDashboard from "./CustomerDashboard";
import AdminPanel from "./AdminPanel";
import type { AccountMode } from "./AccountPage";
function AccountContents({
  mode,
  onReady,
}: {
  mode: AccountMode;
  onReady: () => void;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState("");
  const signInSurface = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (isLoaded) onReady();
  }, [isLoaded, onReady]);
  if (!isLoaded) return <p role="status">Loading your secure account…</p>;
  if (isSignedIn)
    return (
      <div className="account-profile">
        <div className="account-session-actions">
          <span>Signed in securely</span>
          <button
            className="text-link"
            disabled={leaving}
            onClick={async () => {
              setLeaving(true);
              setError("");
              try {
                await signOut({ redirectUrl: "/sign-in" });
              } catch {
                setError("Sign-out could not be completed. Please try again.");
                setLeaving(false);
              }
            }}
          >
            {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>
        <p role="alert">{error}</p>
        {mode === "admin" ? (
          <AdminPanel />
        ) : (
          <>
            <CustomerDashboard />
            <details>
              <summary>Account security and sign-in methods</summary>
              <UserProfile
                routing="hash"
                fallback={<p role="status">Loading profile controls…</p>}
              />
            </details>
          </>
        )}
        <p className="account-scope">
          Saved carts and addresses use your account when storage is available.
          Enquiries require business confirmation; no online payment is
          processed.
        </p>
      </div>
    );
  if (recovering)
    return (
      <PasswordRecovery
        initialEmail={email}
        onBack={() => setRecovering(false)}
      />
    );
  return mode === "sign-up" ? (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/account"
      signInForceRedirectUrl="/account"
      fallback={<p role="status">Loading sign-up…</p>}
    />
  ) : (
    <div className="signin-with-recovery" ref={signInSurface}>
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        forceRedirectUrl={mode === "admin" ? "/admin" : "/account"}
        signUpForceRedirectUrl={mode === "admin" ? "/admin" : "/account"}
        oauthFlow="redirect"
        fallback={<p role="status">Loading sign-in…</p>}
      />
      <button
        className="text-link recovery-link"
        onClick={() => {
          // Clerk mounts a separate React root, so read only the standard email
          // input at this explicit action. Never read or persist the password.
          const entered =
            signInSurface.current?.querySelector<HTMLInputElement>(
              'input[autocomplete="email"],input[name="identifier"]',
            )?.value;
          setEmail(entered || email);
          setRecovering(true);
        }}
      >
        Forgot password?
      </button>
    </div>
  );
}
export default function ClerkAccount({
  mode,
  onReady,
}: {
  mode: AccountMode;
  onReady: () => void;
}) {
  return <AccountContents mode={mode} onReady={onReady} />;
}
