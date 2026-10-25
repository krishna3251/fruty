// Owner-supplied PUBLIC Firebase web configuration, not Admin SDK credentials.
// Analytics is deliberately not initialized here; optional tracking needs consent.
export const firebaseProject = {
  apiKey: "AIzaSyCuZcZlbHWywQtXwBz0novrp7p2VQH8LmA",
  authDomain: "fruty-189ed.firebaseapp.com",
  projectId: "fruty-189ed",
  appId: "1:203931840323:web:335b536d0836fca07d49f6",
};
export type FirebasePublicConfig = typeof firebaseProject;
export function resolveFirebaseConfig(
  env: Record<string, string | undefined>,
): FirebasePublicConfig {
  const override = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  // Never combine one project's partial override with another project's defaults.
  if (!Object.values(override).some(Boolean)) return { ...firebaseProject };
  return {
    apiKey: override.apiKey || "",
    authDomain: override.authDomain || "",
    projectId: override.projectId || "",
    appId: override.appId || "",
  };
}
