import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __crmPool?: Pool;
};

const pool =
  globalForDb.__crmPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase pooler ne supporte pas les prepared statements côté serveur.
    max: 5,
  });

globalForDb.__crmPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
export * from "./schema";
