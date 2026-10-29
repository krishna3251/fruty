import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  Component,
  type ReactNode,
} from "react";
import { useNotify } from "./Notifications";
import { ClerkProvider, useAuth, useUser } from "@clerk/react";
import { accountProfile, type AccountProfile } from "../lib/profile";
import {
  clerkPublishableKey,
  validClerkPublishableKey,
} from "../lib/authConfig";
type Session = {
  status: "loading" | "guest" | "signed-in" | "unavailable";
  userId: string | null;
  getToken: () => Promise<string | null>;
  profile?: AccountProfile | null;
};
const guest: Session = {
  status: "unavailable",
  userId: null,
  getToken: async () => null,
};
export const SessionContext = createContext<Session>(guest);
function Bridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const [slow, setSlow] = useState(false);
  const notify = useNotify();
  const previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current === false && isSignedIn)
      notify("Signed in securely. Welcome to your pantry.", "success");
    if (previous.current === true && !isSignedIn)
      notify(
        "You’re signed out. Continue as a guest or sign in again.",
        "info",
      );
    previous.current = !!isSignedIn;
  }, [isLoaded, isSignedIn, notify]);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(id);
  }, []);
  return (
    <SessionContext.Provider
      value={{
        status: isLoaded
          ? isSignedIn
            ? "signed-in"
            : "guest"
          : slow
            ? "unavailable"
            : "loading",
        userId: userId || null,
        getToken,
        profile: isSignedIn && user ? accountProfile(user) : null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
class SessionBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function SessionProvider({ children }: { children: ReactNode }) {
  if (!validClerkPublishableKey(clerkPublishableKey))
    return (
      <SessionContext.Provider value={guest}>
        {children}
      </SessionContext.Provider>
    );
  return (
    <SessionBoundary
      fallback={
        <SessionContext.Provider value={guest}>
          {children}
        </SessionContext.Provider>
      }
    >
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignOutUrl="/sign-in"
        telemetry={{ disabled: true }}
        localization={{
          signIn: {
            start: {
              title: "Sign in to Tropical Feast",
              subtitle: "Your pantry awaits.",
            },
          },
          signUp: {
            start: {
              title: "Create your pantry account",
              subtitle: "Welcome to Tropical Feast.",
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
            borderRadius: "8px",
            fontFamily: "Manrope, Arial, sans-serif",
          },
        }}
      >
        <Bridge>{children}</Bridge>
      </ClerkProvider>
    </SessionBoundary>
  );
}
export const useSession = () => useContext(SessionContext);
export const GUEST_PREFERENCE = "tf-guest-session-v1";
export function guestDismissed() {
  try {
    return sessionStorage.getItem(GUEST_PREFERENCE) === "yes";
  } catch {
    return false;
  }
}
export function rememberGuest() {
  try {
    sessionStorage.setItem(GUEST_PREFERENCE, "yes");
  } catch {
    /* In-memory dismissal still works. */
  }
}

export function useFirstVisitLogin(
  path: string,
  setOpen: (open: boolean) => void,
) {
  const session = useSession();
  const offered = useRef(false);
  const hadAuthenticatedSession = useRef(false);
  useEffect(() => {
    if (session.status === "signed-in") {
      hadAuthenticatedSession.current = true;
      offered.current = false;
      setOpen(false);
      try {
        sessionStorage.removeItem(GUEST_PREFERENCE);
      } catch {}
      return;
    }
    // A real sign-out/session expiry takes precedence over an old guest dismissal.
    // Keep this flag through Clerk's intermediate loading state.
    if (session.status === "guest" && hadAuthenticatedSession.current) {
      hadAuthenticatedSession.current = false;
      offered.current = false;
      try {
        sessionStorage.removeItem(GUEST_PREFERENCE);
      } catch {}
    }
    if (
      session.status === "guest" &&
      !offered.current &&
      !guestDismissed() &&
      ![
        "/admin",
        "/account",
        "/sign-in",
        "/sign-up",
        "/privacy",
        "/terms",
      ].includes(path)
    ) {
      offered.current = true;
      setOpen(true);
    }
  }, [session.status, path, setOpen]);
}
