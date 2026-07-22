import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Connexion PostgreSQL via Supabase
 */

const globalForDb = globalThis as unknown as {
  __crmPool?: Pool;
};

const pool =
  globalForDb.__crmPool ??
  (() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__crmPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
export * from "./schema";
