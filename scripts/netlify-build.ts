import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { safeOrigin } from "../src/lib/seo.ts";
import { validFirebaseConfig } from "../src/lib/firebaseConfig.ts";
import { resolveFirebaseConfig } from "../src/lib/firebaseProject.ts";
import { securityHeaders } from "../server/securityHeaders.ts";
const origin = process.env.VITE_PUBLIC_SITE_URL || process.env.URL;
if (!origin)
  throw Error(
    "Set VITE_PUBLIC_SITE_URL to the actual Netlify site URL before building.",
  );
process.env.VITE_PUBLIC_SITE_URL = safeOrigin(origin);
process.env.VITE_AUTH_PROVIDER = "firebase";
// Use the verified owner-supplied public project by default. Full env overrides
// remain supported for isolated preview projects; partial overrides fail closed.
const publicConfig = resolveFirebaseConfig(process.env);
if (!validFirebaseConfig(publicConfig))
  throw Error(
    "Invalid or incomplete Firebase public configuration. Supply all four VITE_FIREBASE_* values together, or remove overrides to use fruty-189ed.",
  );
execFileSync("npm", ["run", "build"], { stdio: "inherit", env: process.env });
const headers =
  [
    "/*",
    ...Object.entries(securityHeaders).map(
      ([key, value]) => `  ${key}: ${value}`,
    ),
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    ...["account", "sign-in", "sign-up", "admin"].flatMap((p) => [
      `/${p}`,
      "  X-Robots-Tag: noindex, nofollow",
      "  Cache-Control: private, no-store",
    ]),
  ].join("\n") + "\n";
writeFileSync("dist/_headers", headers);
