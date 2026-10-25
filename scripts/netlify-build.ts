import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { safeOrigin } from "../src/lib/seo.ts";
import { validFirebaseConfig } from "../src/lib/firebaseConfig.ts";
import { securityHeaders } from "../server/securityHeaders.ts";
const origin = process.env.VITE_PUBLIC_SITE_URL || process.env.URL;
if (!origin)
  throw Error(
    "Set VITE_PUBLIC_SITE_URL to the actual Netlify site URL before building.",
  );
process.env.VITE_PUBLIC_SITE_URL = safeOrigin(origin);
process.env.VITE_AUTH_PROVIDER = "firebase";
// Never publish a production deployment with placeholder auth configuration.
for (const key of [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_APP_ID",
])
  if (!process.env[key])
    throw Error(`Set ${key} in Netlify build settings before deploying.`);
if (
  !validFirebaseConfig({
    apiKey: process.env.VITE_FIREBASE_API_KEY!,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
    appId: process.env.VITE_FIREBASE_APP_ID!,
  })
)
  throw Error(
    "Invalid Firebase public web configuration. Copy the web app configuration from your own Firebase project.",
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
