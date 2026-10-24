// Only the public frontend key belongs in the browser. Never expose CLERK_SECRET_KEY.
export function validClerkPublishableKey(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^pk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(value)
  )
    return false;
  try {
    const host = atob(value.replace(/^pk_(test|live)_/, "")).replace(/\$$/, "");
    return (
      host.includes(".") && /^[a-z0-9.-]+$/i.test(host) && !host.includes("..")
    );
  } catch {
    return false;
  }
}
export const clerkPublishableKey =
  import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || "";
