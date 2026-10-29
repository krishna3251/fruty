import { useEffect, useState, useRef } from "react";
import { SignIn, SignUp, UserProfile, useClerk, useUser } from "@clerk/react";
import PasswordRecovery from "./PasswordRecovery";
import AccountWorkspace from "./AccountWorkspace";
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
  if (isSignedIn) {
    const handleSignOut = async () => {
      setLeaving(true);
      setError("");
      try {
        await signOut({ redirectUrl: "/sign-in" });
      } catch {
        setError("Sign-out could not be completed. Please try again.");
        setLeaving(false);
      }
    };
    return mode === "admin" ? (
      <div className="account-profile">
        <div className="account-session-actions">
          <span>Signed in securely</span>
          <button
            className="text-link"
            disabled={leaving}
            onClick={() => void handleSignOut()}
          >
            {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>
        <p role="alert">{error}</p>
        <AdminPanel />
        <p className="account-scope">
          Saved carts and addresses use your account when storage is available.
          Enquiries require business confirmation; no online payment is
          processed.
        </p>
      </div>
    ) : (
      <AccountWorkspace
        signOut={() => void handleSignOut()}
        leaving={leaving}
        error={error}
        profileControls={
          <UserProfile
            routing="hash"
            fallback={<p role="status">Loading profile controls…</p>}
          />
        }
      />
    );
  }
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
