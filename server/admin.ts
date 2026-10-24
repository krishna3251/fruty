import { createClerkClient } from "@clerk/backend";
import { scryptSync, timingSafeEqual } from "node:crypto";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export function ownerMatches(
  user: {
    emailAddresses: {
      emailAddress: string;
      verification: { status: string } | null;
    }[];
  },
  owner: string,
) {
  return (
    !!owner &&
    user.emailAddresses.some(
      (e) =>
        e.emailAddress.toLowerCase() === owner.toLowerCase() &&
        e.verification?.status === "verified",
    )
  );
}
export function verifyPanelPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash) || password.length > 200)
    return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export async function requireOwner(request: Request) {
  const origin =
    process.env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app";
  if (request.headers.get("origin") !== origin)
    throw new ApiError(403, "This request must come from the shop website.");
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD_HASH
  )
    throw new ApiError(503, "Owner access needs server configuration.");
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  const state = await clerk.authenticateRequest(request, {
    authorizedParties: [origin],
    acceptsToken: "session_token",
  });
  const auth = state.toAuth();
  if (!auth?.userId)
    throw new ApiError(401, "Sign in to your owner account first.");
  const user = await clerk.users.getUser(auth.userId);
  if (!ownerMatches(user, process.env.ADMIN_EMAIL))
    throw new ApiError(403, "This account does not have owner access.");
  if (
    !verifyPanelPassword(
      request.headers.get("x-panel-password") || "",
      process.env.ADMIN_PASSWORD_HASH,
    )
  )
    throw new ApiError(403, "The panel password is incorrect.");
  return auth.userId;
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.message }, error.status);
  console.error(
    "Catalogue operation failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    {
      error:
        "We couldn’t save or load the catalogue. Try again; your changes have not been confirmed.",
    },
    503,
  );
}
