import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Connexion SQLite unique et partagée.
 * En développement, Next.js recharge les modules à chaque édition : on met la
 * connexion en cache sur `globalThis` pour éviter d'ouvrir des dizaines de handles.
 */

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL ?? "./data/crm.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { __crmSqlite?: Database.Database };

const sqlite =
  globalForDb.__crmSqlite ??
  (() => {
    const conn = new Database(dbPath);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    return conn;
  })();

if (process.env.NODE_ENV !== "production") globalForDb.__crmSqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export { schema };
export * from "./schema";
