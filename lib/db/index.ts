import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import path from "path";

const globalForDb = globalThis as unknown as {
  __crmPool?: Pool;
};

const pool =
  globalForDb.__crmPool ??
  (() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__crmPool = pool;
}

const db = drizzle(pool, { schema });

// Run migrations automatically on startup (production + dev)
if (process.env.NODE_ENV === "production" || process.env.RUN_MIGRATIONS === "true") {
  migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  }).catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  });
}

export { db, schema };
export * from "./schema";
