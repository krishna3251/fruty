import { getApps, initializeApp, cert } from "firebase-admin/app";
import {
  getAuth,
  type DecodedIdToken,
  type UserRecord,
} from "firebase-admin/auth";
import { ApiError } from "./admin.js";
export function firebaseSubject(project: string, uid: string) {
  return `firebase:${project}:${uid}`;
}
export class UnverifiedFirebaseEmail extends ApiError {
  constructor() {
    super(403, "Verify your email before using saved account data.");
  }
}
export function checkedFirebaseUser(
  token: DecodedIdToken,
  user: UserRecord,
  project: string,
) {
  if (
    user.disabled ||
    token.uid !== user.uid ||
    token.aud !== project ||
    token.iss !== `https://securetoken.google.com/${project}`
  )
    throw new ApiError(401, "Your session expired. Please sign in again.");
  if (!user.email || !user.emailVerified) throw new UnverifiedFirebaseEmail();
  return {
    userId: firebaseSubject(project, user.uid),
    uid: user.uid,
    name: user.displayName || "",
    email: user.email,
  };
}
export async function firebaseIdentity(request: Request) {
  if (
    process.env.FIREBASE_AUTH_EMULATOR_HOST &&
    process.env.NODE_ENV === "production"
  )
    throw new ApiError(
      503,
      "Authentication emulators cannot be used in production.",
    );
  const project = process.env.FIREBASE_PROJECT_ID;
  const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!project || !credentials)
    throw new ApiError(
      503,
      "Secure account access needs server configuration. Browse as a guest meanwhile.",
    );
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer || bearer.length > 12000)
    throw new ApiError(401, "Sign in again to access your account.");
  let app = getApps().find((a) => a.name === "tropical-feast-firebase");
  if (!app) {
    let account;
    try {
      account = JSON.parse(credentials);
    } catch {
      throw new ApiError(503, "Secure account configuration is unavailable.");
    }
    if (
      account.project_id !== project ||
      !account.client_email ||
      !account.private_key
    )
      throw new ApiError(503, "Secure account configuration is unavailable.");
    app = initializeApp(
      { credential: cert(account), projectId: project },
      "tropical-feast-firebase",
    );
  }
  try {
    const auth = getAuth(app);
    // Revocation + disabled-account checks are server-side; no decoded browser claim is trusted.
    const decoded = await auth.verifyIdToken(bearer, true);
    const user = await auth.getUser(decoded.uid);
    return checkedFirebaseUser(decoded, user, project);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const code = (error as { code?: string }).code || "";
    if (
      code.startsWith("auth/") &&
      ![
        "auth/internal-error",
        "auth/insufficient-permission",
        "auth/invalid-credential",
      ].includes(code)
    )
      throw new ApiError(401, "Your session expired. Sign in again.");
    throw new ApiError(
      503,
      "We couldn’t verify your session. Try again or browse as a guest.",
    );
  }
}
