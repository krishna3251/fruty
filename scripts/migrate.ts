import { sqlStatements } from "./sqlStatements.js";
import { neon } from "@neondatabase/serverless";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url)
  throw Error(
    "Set server-only DATABASE_URL or POSTGRES_URL. No database was changed.",
  );
const sql = neon(url);
await sql`CREATE TABLE IF NOT EXISTS tf_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
for (const name of (await readdir("migrations"))
  .filter((n) => /^\d+.*\.sql$/.test(n))
  .sort()) {
  const source = await readFile(`migrations/${name}`, "utf8");
  const checksum = createHash("sha256").update(source).digest("hex");
  const existing =
    await sql`SELECT checksum FROM tf_migrations WHERE name=${name}`;
  if (existing.length) {
    if (existing[0].checksum !== checksum)
      throw Error(
        `Migration ${name} changed after application. Add a new migration.`,
      );
    continue;
  }
  await sql.transaction([
    ...sqlStatements(source).map((statement) => sql.query(statement)),
    sql`INSERT INTO tf_migrations(name,checksum) VALUES(${name},${checksum})`,
  ]);
  console.log(`Applied ${name}`);
}
