import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { firebaseConfigured, firebasePublicConfig } from "./firebaseConfig";
let auth: ReturnType<typeof getAuth> | undefined;
let ready: Promise<void> | undefined;
export function firebaseAuth() {
  if (!firebaseConfigured)
    throw Error(
      "Firebase authentication is not configured for this environment.",
    );
  if (!auth) {
    const app =
      getApps().find((a) => a.name === "tropical-feast") ||
      initializeApp(firebasePublicConfig, "tropical-feast");
    auth = getAuth(app);
    auth.useDeviceLanguage();
  }
  return auth;
}
export function prepareFirebaseAuth() {
  if (!ready)
    ready = setPersistence(firebaseAuth(), indexedDBLocalPersistence).catch(
      () => setPersistence(firebaseAuth(), browserSessionPersistence),
    );
  return ready;
}
export function authError(error: unknown) {
  const code = (error as { code?: string }).code || "";
  if (
    [
      "auth/invalid-credential",
      "auth/user-not-found",
      "auth/wrong-password",
      "auth/invalid-email",
    ].includes(code)
  )
    return "We couldn’t sign you in. Check your email and password, or use Forgot password.";
  if (code === "auth/email-already-in-use")
    return "Account creation could not finish. Try signing in or recovering your password.";
  if (
    code === "auth/weak-password" ||
    code === "auth/password-does-not-meet-requirements"
  )
    return "Choose a stronger, unique password that meets the password guidance.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Wait a few minutes and try again.";
  if (
    code === "auth/popup-blocked" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  )
    return "Google sign-in was not completed. Allow the sign-in popup and try again.";
  if (code === "auth/network-request-failed")
    return "We couldn’t connect. Check your connection and try again.";
  if (
    code === "auth/unauthorized-domain" ||
    code === "auth/operation-not-allowed" ||
    code === "auth/configuration-not-found"
  )
    return "This sign-in method needs business configuration. You can still browse as a guest.";
  if (code === "auth/requires-recent-login")
    return "Sign out and sign in again before changing account security.";
  return "The account service could not complete that action. Try again; nothing has been confirmed.";
}
