import { useEffect, useState, type ReactNode } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { SessionContext } from "./Session";
import { firebaseAuth, prepareFirebaseAuth } from "../lib/firebaseClient";
import { firebasePublicConfig } from "../lib/firebaseConfig";
export default function FirebaseSession({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    status: "loading" | "guest" | "signed-in" | "unavailable";
    userId: string | null;
  }>({ status: "loading", userId: null });
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const timer = window.setTimeout(() => {
      if (active) setState({ status: "unavailable", userId: null });
    }, 15000);
    void prepareFirebaseAuth()
      .then(() => {
        if (!active) return;
        unsubscribe = onIdTokenChanged(
          firebaseAuth(),
          (user) => {
            if (!active) return;
            clearTimeout(timer);
            setState({
              status: user ? "signed-in" : "guest",
              userId: user
                ? `firebase:${firebasePublicConfig.projectId}:${user.uid}`
                : null,
            });
          },
          () => {
            if (active) setState({ status: "unavailable", userId: null });
          },
        );
      })
      .catch(() => {
        if (active) setState({ status: "unavailable", userId: null });
      });
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
  return (
    <SessionContext.Provider
      value={{
        ...state,
        getToken: async () => {
          const auth = firebaseAuth();
          const user = auth.currentUser;
          if (
            !user ||
            state.userId !==
              `firebase:${firebasePublicConfig.projectId}:${user.uid}`
          )
            return null;
          try {
            const token = await user.getIdToken();
            return auth.currentUser === user ? token : null;
          } catch {
            // An old request must never sign a newly selected account out.
            if (auth.currentUser === user) await signOut(auth).catch(() => {});
            return null;
          }
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
