import { useEffect, useState } from "react";
import { SignIn, SignUp, UserProfile, useClerk, useUser } from "@clerk/react";
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
  return mode === "sign-up" ? (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/account"
      signInForceRedirectUrl="/account"
      fallback={<p role="status">Loading sign-up…</p>}
    />
  ) : (
    <SignIn
      routing="hash"
      signUpUrl="/sign-up"
      forceRedirectUrl={mode === "admin" ? "/admin" : "/account"}
      signUpForceRedirectUrl={mode === "admin" ? "/admin" : "/account"}
      oauthFlow="redirect"
      fallback={<p role="status">Loading sign-in…</p>}
    />
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
