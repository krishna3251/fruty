// Explicit, verified one-account transfer. Never runs in a build or public endpoint.
import { createClerkClient } from "@clerk/backend";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "../server/db.ts";
import { firebaseSubject } from "../server/firebaseAuth.ts";
const args = process.argv.slice(2);
const oldId = args.find((v) => v.startsWith("--clerk="))?.slice(8);
const firebaseUid = args.find((v) => v.startsWith("--firebase="))?.slice(11);
const apply = args.includes("--apply");
async function main() {
  if (
    !oldId ||
    !/^user_[a-zA-Z0-9]+$/.test(oldId) ||
    !firebaseUid ||
    firebaseUid.length > 128 ||
    /[\s/]/.test(firebaseUid)
  )
    throw Error(
      "Supply explicit --clerk=user_ID and --firebase=UID identifiers.",
    );
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    !process.env.FIREBASE_PROJECT_ID
  )
    throw Error(
      "Server credentials for both providers are required. Never put them in the command or repository.",
    );
  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (credentials.project_id !== process.env.FIREBASE_PROJECT_ID)
    throw Error("Firebase project configuration does not match.");
  const app = initializeApp(
    { credential: cert(credentials), projectId: credentials.project_id },
    "identity-transfer",
  );
  try {
    const [oldUser, newUser] = await Promise.all([
      createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      }).users.getUser(oldId),
      getAuth(app).getUser(firebaseUid),
    ]);
    if (
      newUser.disabled ||
      !newUser.emailVerified ||
      !newUser.email ||
      !oldUser.emailAddresses.some(
        (e) =>
          e.verification?.status === "verified" &&
          e.emailAddress.toLowerCase() === newUser.email!.toLowerCase(),
      )
    )
      throw Error(
        "Both explicitly selected identities must have the same verified email and an active Firebase account.",
      );
    const sql = db();
    const target = firebaseSubject(credentials.project_id, newUser.uid);
    const records =
      await sql`SELECT id,clerk_user_id FROM tf_customers WHERE clerk_user_id IN (${oldId},${target})`;
    const previous = records.find((r) => r.clerk_user_id === oldId);
    if (!previous)
      throw Error("No legacy store account found for the selected identity.");
    if (records.some((r) => r.clerk_user_id === target))
      throw Error(
        "The Firebase account already has store data. No automatic merge is allowed.",
      );
    console.info(
      "Both identities verified. Existing customer UUID, addresses, cart and enquiries will be preserved.",
    );
    if (!apply) {
      console.info(
        "Dry run only. Review backups and pause writes on the old site before using --apply.",
      );
      return;
    }
    if (!args.includes("--confirm-backup-and-cutover"))
      throw Error(
        "Review the database backup and cutover first; --confirm-backup-and-cutover is required.",
      );
    const updated =
      await sql`UPDATE tf_customers SET clerk_user_id=${target},updated_at=now() WHERE id=${previous.id}::uuid AND clerk_user_id=${oldId} AND NOT EXISTS(SELECT 1 FROM tf_customers WHERE clerk_user_id=${target}) RETURNING id`;
    if (updated.length !== 1)
      throw Error(
        "Identity changed during transfer. Reload and review; no merge was attempted.",
      );
    console.info(
      "Identity linked. Existing customer UUID and all related store data were preserved. No password was copied.",
    );
  } finally {
    await deleteApp(app);
  }
}
main().catch((e) => {
  console.error(
    e instanceof Error && !e.name.includes("Firebase")
      ? e.message
      : "Identity verification failed. No transfer confirmed.",
  );
  process.exitCode = 1;
});
