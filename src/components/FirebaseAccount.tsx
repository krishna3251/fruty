import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  reload,
  deleteUser,
} from "firebase/auth";
import { firebaseAuth, authError } from "../lib/firebaseClient";
import { firebaseGoogleEnabled } from "../lib/firebaseConfig";
import { useSession } from "../context/Session";
import { navigate } from "../hooks/useRoute";
import FirebaseAuthForm from "./FirebaseAuthForm";
import CustomerDashboard from "./CustomerDashboard";
import AdminPanel from "./AdminPanel";
import type { AccountMode } from "./AccountPage";
export default function FirebaseAccount({
  mode,
  onReady,
}: {
  mode: AccountMode;
  onReady: () => void;
}) {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [deletion, setDeletion] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const pending = useRef(false);
  const user = firebaseAuth().currentUser;
  useEffect(() => {
    if (session.status !== "loading") onReady();
  }, [session.status, onReady]);
  useEffect(() => {
    setName(user?.displayName || "");
  }, [user?.uid]);
  const destination = mode === "admin" ? "/admin" : "/account";
  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
    } catch (e) {
      setError(authError(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (session.status === "loading")
    return <p role="status">Connecting securely…</p>;
  if (!user || session.status !== "signed-in")
    return (
      <FirebaseAuthForm
        signup={mode === "sign-up"}
        actions={{
          error: authError,
          signIn: async (email, password) => {
            await signInWithEmailAndPassword(firebaseAuth(), email, password);
            navigate(destination);
          },
          signUp: async (displayName, email, password) => {
            const created = await createUserWithEmailAndPassword(
              firebaseAuth(),
              email,
              password,
            );
            try {
              await updateProfile(created.user, { displayName });
              await sendEmailVerification(created.user);
            } finally {
              navigate(destination);
            }
          },
          reset: async (email) => {
            try {
              await sendPasswordResetEmail(firebaseAuth(), email);
            } catch (e) {
              if ((e as { code?: string }).code !== "auth/user-not-found")
                throw e;
            }
          },
          ...(firebaseGoogleEnabled
            ? {
                google: async () => {
                  await signInWithPopup(
                    firebaseAuth(),
                    new GoogleAuthProvider(),
                  );
                  navigate(destination);
                },
              }
            : {}),
        }}
      />
    );
  return (
    <div className="account-profile firebase-profile">
      <div className="account-session-actions">
        <span>Signed in securely with Firebase</span>
        <button
          className="text-link"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await signOut(firebaseAuth());
              navigate("/sign-in");
            })
          }
        >
          {busy ? "Please wait…" : "Sign out"}
        </button>
      </div>
      <p className="form-error" role="alert">
        {error}
      </p>
      <p role="status">{status}</p>
      {!user.emailVerified ? (
        <section className="enquiry-ready">
          <h2>One last step: verify your email.</h2>
          <p>
            Check your inbox and spam folder. Saved carts, addresses and owner
            access stay locked until Firebase verifies your email. You can shop
            and enquire as a guest.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (Date.now() < retryAt) {
                  setError("Wait 60 seconds before requesting another email.");
                  return;
                }
                setRetryAt(Date.now() + 60000);
                await sendEmailVerification(user);
                setStatus(
                  "Verification was requested. Check your inbox; delivery is not guaranteed.",
                );
              })
            }
          >
            Request verification email
          </button>
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await reload(user);
                await user.getIdToken(true);
                setStatus(
                  user.emailVerified
                    ? "Email verified. Your account is ready."
                    : "Not verified yet. Open the link in your email, then try again.",
                );
              })
            }
          >
            I verified my email — check again
          </button>
        </section>
      ) : mode === "admin" ? (
        <AdminPanel />
      ) : (
        <CustomerDashboard />
      )}
      <details className="firebase-security">
        <summary>Account profile & security</summary>
        <p>
          Sign-in methods:{" "}
          {user.providerData
            .map((p) =>
              p.providerId === "password"
                ? "Email/password"
                : p.providerId === "google.com"
                  ? "Google"
                  : p.providerId,
            )
            .join(", ") || "Firebase"}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (name.trim().length < 2) {
                setError("Enter a name of at least two characters.");
                return;
              }
              await updateProfile(user, { displayName: name.trim() });
              setStatus("Your profile name was updated.");
            });
          }}
        >
          <label>
            Your name
            <input
              required
              autoComplete="name"
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="button outline" disabled={busy}>
            Save profile name
          </button>
        </form>
        {user.email && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (Date.now() < retryAt) {
                  setError("Wait 60 seconds before requesting another email.");
                  return;
                }
                setRetryAt(Date.now() + 60000);
                await sendPasswordResetEmail(firebaseAuth(), user.email!);
                setStatus(
                  "Password recovery was requested. Check your inbox and spam folder. Google account passwords are managed by Google.",
                );
              })
            }
          >
            Email a password reset link
          </button>
        )}
        <details className="delete-account-data">
          <summary>Delete my sign-in account</summary>
          <p>
            This permanently deletes your Firebase sign-in account. First use
            Delete my store data above if you also want to remove linked carts,
            addresses and enquiries. Deleting sign-in alone does not erase those
            records or messages already sent. A recent sign-in may be required.
          </p>
          <label>
            Type DELETE MY ACCOUNT
            <input
              autoComplete="off"
              value={deletion}
              onChange={(e) => setDeletion(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            disabled={busy || deletion !== "DELETE MY ACCOUNT"}
            onClick={() =>
              void run(async () => {
                await deleteUser(user);
                navigate("/sign-in");
              })
            }
          >
            Permanently delete sign-in account
          </button>
        </details>
      </details>
    </div>
  );
}
