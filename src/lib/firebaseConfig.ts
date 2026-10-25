export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};
export const authProvider =
  import.meta.env?.VITE_AUTH_PROVIDER === "firebase" ? "firebase" : "clerk";
export const firebasePublicConfig: FirebasePublicConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "",
};
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
