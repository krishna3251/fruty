import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  firebaseProject,
  resolveFirebaseConfig,
} from "../src/lib/firebaseProject.ts";
import { validFirebaseConfig } from "../src/lib/firebaseConfig.ts";
import {
  checkedFirebaseUser,
  firebaseSubject,
  firebaseIdentity,
} from "../server/firebaseAuth.ts";
import { netlifyRouter } from "../server/netlifyRouter.ts";
import { securityHeaders } from "../server/securityHeaders.ts";
import { customerIdentity } from "../server/customerAuth.ts";
import { requireOwner } from "../server/admin.ts";
const config = {
  projectId: "unit-pickle-project",
  authDomain: "unit-pickle-project.firebaseapp.com",
  apiKey: "AIza" + "x".repeat(35),
  appId: "1:123456789:web:abcdef123",
};
test("Firebase config accepts its public project host and rejects placeholders and injected hosts", () => {
  assert.ok(validFirebaseConfig(config));
  assert.ok(!validFirebaseConfig({ ...config, apiKey: "" }));
  assert.ok(!validFirebaseConfig({ ...config, authDomain: "evil.test" }));
  assert.ok(!validFirebaseConfig({ ...config, projectId: "../../project" }));
});
test("Firebase identity is project-qualified, verified, active and cannot claim an old Clerk account by email", () => {
  const decoded: any = {
    uid: "customer-1",
    aud: config.projectId,
    iss: `https://securetoken.google.com/${config.projectId}`,
  };
  const user: any = {
    uid: "customer-1",
    displayName: "Unit Buyer",
    email: "buyer@example.test",
    emailVerified: true,
    disabled: false,
  };
  const result = checkedFirebaseUser(decoded, user, config.projectId);
  assert.equal(result.userId, firebaseSubject(config.projectId, user.uid));
  assert.notEqual(result.userId, "user_old_clerk_account");
  assert.throws(
    () =>
      checkedFirebaseUser(
        decoded,
        { ...user, emailVerified: false },
        config.projectId,
      ),
    /Verify your email/,
  );
  assert.throws(
    () =>
      checkedFirebaseUser(
        decoded,
        { ...user, disabled: true },
        config.projectId,
      ),
    /session expired/,
  );
  assert.throws(
    () =>
      checkedFirebaseUser(
        { ...decoded, aud: "other-project" },
        user,
        config.projectId,
      ),
    /session expired/,
  );
  assert.throws(
    () =>
      checkedFirebaseUser(
        { ...decoded, uid: "another-user" },
        user,
        config.projectId,
      ),
    /session expired/,
  );
});
test("Firebase backend fails closed without credentials/bearer and forbids an emulator in production", async () => {
  const old = { ...process.env };
  try {
    process.env.AUTH_PROVIDER = "firebase";
    process.env.VITE_PUBLIC_SITE_URL = "https://unit.netlify.app";
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    await assert.rejects(
      () =>
        customerIdentity(
          new Request("https://unit.netlify.app/api/customer", {
            headers: { origin: "https://unit.netlify.app" },
          }),
        ),
      /server configuration/,
    );
    process.env.FIREBASE_PROJECT_ID = config.projectId;
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "{}";
    await assert.rejects(
      () =>
        firebaseIdentity(new Request("https://unit.netlify.app/api/customer")),
      /Sign in again/,
    );
    process.env.NODE_ENV = "production";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    await assert.rejects(
      () =>
        firebaseIdentity(new Request("https://unit.netlify.app/api/customer")),
      /emulators/,
    );
    delete process.env.FIREBASE_ADMIN_UID;
    await assert.rejects(
      () =>
        requireOwner(
          new Request("https://unit.netlify.app/api/catalogue", {
            headers: { origin: "https://unit.netlify.app" },
          }),
        ),
      /configuration/,
    );
  } finally {
    process.env = old;
  }
});
test("Netlify adapter preserves API methods, unknown-route errors, security headers, HEAD and archived pages", async () => {
  const method = await netlifyRouter(
    new Request(
      "https://unit.netlify.app/.netlify/functions/storefront?endpoint=customer",
    ),
  );
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "POST");
  assert.equal(
    method.headers.get("Content-Security-Policy"),
    securityHeaders["Content-Security-Policy"],
  );
  const unknown = await netlifyRouter(
    new Request(
      "https://unit.netlify.app/.netlify/functions/storefront?endpoint=__proto__",
    ),
  );
  assert.equal(unknown.status, 404);
  const denied = await netlifyRouter(
    new Request(
      "https://unit.netlify.app/.netlify/functions/storefront?endpoint=catalogue",
      {
        method: "POST",
        headers: { origin: "https://foreign.test" },
        body: "{}",
      },
    ),
  );
  assert.equal(denied.status, 403);
  const gone = await netlifyRouter(
    new Request(
      "https://unit.netlify.app/.netlify/functions/storefront?endpoint=gone",
      { method: "HEAD" },
    ),
  );
  assert.equal(gone.status, 410);
  assert.equal(await gone.text(), "");
  const archive = await netlifyRouter(
    new Request(
      "https://unit.netlify.app/.netlify/functions/storefront?endpoint=product-page&slug=mango",
    ),
  );
  assert.equal(archive.status, 200);
  assert.match(await archive.text(), /noindex/);
  const toml = readFileSync("netlify.toml", "utf8");
  assert.ok(
    toml.indexOf('from = "/products/fermented-cucumber-pickle"') <
      toml.indexOf('from = "/products/:slug"'),
  );
  assert.ok(toml.includes('included_files = ["dist/**/*.html"]'));
});

test("Netlify catalogue uses conditional writes so stale edits and double initialization cannot overwrite", async () => {
  const { readNetlifyCatalogue, writeNetlifyCatalogue } =
    await import("../server/netlifyStorage.ts");
  const { pickleProducts } = await import("../src/data/pickles.ts");
  let value: any = null;
  let version = 0;
  const storage: any = {
    getWithMetadata: async () =>
      value && { data: value, etag: `revision-${version}` },
    setJSON: async (_key: string, data: any, options: any) => {
      if (
        (options.onlyIfNew && value) ||
        (options.onlyIfMatch && options.onlyIfMatch !== `revision-${version}`)
      )
        return { modified: false };
      value = data;
      version++;
      return { modified: true, etag: `revision-${version}` };
    },
  };
  assert.equal((await readNetlifyCatalogue(storage)).revision, "initial");
  await writeNetlifyCatalogue(pickleProducts, "initial", storage);
  await assert.rejects(
    () => writeNetlifyCatalogue(pickleProducts, "initial", storage),
    /changed in another tab/,
  );
  const current = await readNetlifyCatalogue(storage);
  const changed = [{ ...pickleProducts[0], price: 175 }, pickleProducts[1]];
  const saved = await writeNetlifyCatalogue(changed, current.revision, storage);
  assert.equal(saved.products[0].price, 175);
  await assert.rejects(
    () => writeNetlifyCatalogue(pickleProducts, current.revision, storage),
    /changed in another tab/,
  );
});

test("Owner Firebase project is available without env duplication; partial project overrides fail closed", () => {
  assert.ok(validFirebaseConfig(resolveFirebaseConfig({})));
  assert.equal(resolveFirebaseConfig({}).projectId, "fruty-189ed");
  assert.deepEqual(resolveFirebaseConfig({}), firebaseProject);
  assert.ok(
    !validFirebaseConfig(
      resolveFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: "other-project" }),
    ),
  );
  assert.deepEqual(
    resolveFirebaseConfig({
      VITE_FIREBASE_API_KEY: config.apiKey,
      VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
      VITE_FIREBASE_PROJECT_ID: config.projectId,
      VITE_FIREBASE_APP_ID: config.appId,
    }),
    config,
  );
});
