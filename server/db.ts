import { neon } from "@neondatabase/serverless";
import { ApiError } from "./admin.js";
export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url)
    throw new ApiError(
      503,
      "Account storage is unavailable. You can still browse and enquire as a guest.",
    );
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(12000) } });
}
