import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __crmDb?: Database.Database;
};

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/crm.db";

const sqliteDb =
  globalForDb.__crmDb ??
  (() => {
    return new Database(dbPath);
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__crmDb = sqliteDb;
}

export const db = drizzle(sqliteDb, { schema });
export { schema };
export * from "./schema";
