import { resolveFirebaseConfig } from "./firebaseProject";
import type { FirebasePublicConfig } from "./firebaseProject";
export type { FirebasePublicConfig } from "./firebaseProject";
export const authProvider =
  import.meta.env?.VITE_AUTH_PROVIDER === "firebase" ? "firebase" : "clerk";
export const firebasePublicConfig = resolveFirebaseConfig(
  import.meta.env || {},
);
export function validFirebaseConfig(c: FirebasePublicConfig) {
  return (
    /^AIza[\w-]{25,}$/.test(c.apiKey) &&
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(c.projectId) &&
    c.authDomain === `${c.projectId}.firebaseapp.com` &&
    /^1:\d+:web:[a-zA-Z0-9]+$/.test(c.appId)
  );
}
export const firebaseConfigured = validFirebaseConfig(firebasePublicConfig);
export const firebaseGoogleEnabled =
  import.meta.env?.VITE_FIREBASE_GOOGLE_ENABLED === "true";
