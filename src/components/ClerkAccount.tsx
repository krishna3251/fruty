import { useEffect, useState } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserProfile,
  useClerk,
  useUser,
} from "@clerk/react";
import { clerkPublishableKey } from "../lib/authConfig";
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
                await signOut({ redirectUrl: "/" });
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
          <UserProfile
            routing="hash"
            fallback={<p role="status">Loading profile controls…</p>}
          />
        )}
        <p className="account-scope">
          Your enquiry basket stays on this device. Online orders, address
          storage and payment history are not connected.
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
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/account"
      signUpFallbackRedirectUrl="/account"
      telemetry={{ disabled: true }}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Fermented Pickles",
            subtitle: "Welcome back. Your pantry awaits.",
          },
        },
        signUp: {
          start: {
            title: "Create your pantry account",
            subtitle: "Welcome to Fermented Pickles.",
          },
        },
      }}
      appearance={{
        elements: {
          rootBox: { maxWidth: "100%", minWidth: 0 },
          cardBox: { maxWidth: "100%", minWidth: 0 },
          card: {
            maxWidth: "100%",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          },
        },
        variables: {
          colorPrimary: "#183D25",
          colorBackground: "#FFF9EE",
          colorForeground: "#272922",
          colorInput: "#FFFDF7",
          borderRadius: "8px",
          fontFamily: "Manrope, Arial, sans-serif",
        },
      }}
    >
      <AccountContents mode={mode} onReady={onReady} />
    </ClerkProvider>
  );
}
