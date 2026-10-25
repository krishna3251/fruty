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
          try {
            return (await firebaseAuth().currentUser?.getIdToken()) || null;
          } catch {
            await signOut(firebaseAuth()).catch(() => {});
            return null;
          }
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
