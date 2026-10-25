import { createClerkClient } from "@clerk/backend";
import { ApiError } from "./admin.js";
export function trustedOrigin(request: Request) {
  const origin =
    process.env.VITE_PUBLIC_SITE_URL || "https://fruty-fawn.vercel.app";
  if (request.headers.get("origin") !== origin)
    throw new ApiError(403, "Open this action from the shop website.");
  return origin;
}
export async function customerIdentity(request: Request, optional = false) {
  const origin = trustedOrigin(request);
  if (optional && !request.headers.get("authorization")) return null;
  if (process.env.AUTH_PROVIDER === "firebase") {
    const { firebaseIdentity, UnverifiedFirebaseEmail } =
      await import("./firebaseAuth.js");
    try {
      return await firebaseIdentity(request);
    } catch (error) {
      if (optional && error instanceof UnverifiedFirebaseEmail) return null;
      throw error;
    }
  }
  if (!process.env.CLERK_SECRET_KEY)
    throw new ApiError(
      503,
      "Secure sign-in is temporarily unavailable. Continue as a guest.",
    );
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
    throw new ApiError(
      401,
      "Your session expired. Sign in again or continue as a guest.",
    );
  const user = await clerk.users.getUser(auth.userId);
  return {
    userId: auth.userId,
    name: user.fullName || user.firstName || "",
    email:
      user.emailAddresses.find((e) => e.verification?.status === "verified")
        ?.emailAddress || null,
  };
}
export { readJson } from "./requestBody.js";
export function customerFailure(e: unknown) {
  if (e instanceof ApiError)
    return Response.json(
      { error: e.message },
      { status: e.status, headers: { "Cache-Control": "private, no-store" } },
    );
  if (e instanceof Error && /address_not_found|address_limit/.test(e.message))
    return Response.json(
      {
        error: /address_limit/.test(e.message)
          ? "You can save up to 10 addresses."
          : "Address not found.",
      },
      {
        status: /address_limit/.test(e.message) ? 400 : 404,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  if (e instanceof Error && /cart_conflict/.test(e.message))
    return Response.json(
      {
        error:
          "Your cart changed on another device. Reload the saved cart before trying again.",
      },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  return Response.json(
    {
      error:
        "We couldn’t save or load this information. Nothing has been confirmed. Try again.",
    },
    { status: 503, headers: { "Cache-Control": "private, no-store" } },
  );
}
