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
export async function readJson(request: Request, limit = 24000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "Send JSON details.");
  if (Number(request.headers.get("content-length")) > limit)
    throw new ApiError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Request details are missing.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Check the request details.");
  }
}
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
