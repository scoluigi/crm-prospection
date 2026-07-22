import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Connexion SQLite unique et partagée.
 */

const globalForDb = globalThis as unknown as { __crmSqlite?: Database.Database };

const sqlite =
  globalForDb.__crmSqlite ??
  (() => {
    const conn = new Database(":memory:");
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    return conn;
  })();

if (process.env.NODE_ENV !== "production") globalForDb.__crmSqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export { schema };
export * from "./schema";
