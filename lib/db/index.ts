import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibSQL } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * Connexion SQLite unique et partagée.
 * Supporte deux modes :
 * - Local (better-sqlite3) : DATABASE_URL=file:./data/crm.db ou vide
 * - Turso/LibSQL (production) : DATABASE_URL=libsql://... ou https://...
 */

type DrizzleInstance = any;

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/crm.db";
const isRemote = databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("https://");

const globalForDb = globalThis as unknown as {
  __crmSqlite?: Database.Database;
  __crmRemoteDb?: any;
};

let db: DrizzleInstance;

if (isRemote) {
  // Mode Turso/LibSQL (production)
  const libsqlClient =
    globalForDb.__crmRemoteDb ??
    (() => {
      const token = process.env.TURSO_CONNECTION_TOKEN;
      const client = createClient({
        url: databaseUrl,
        ...(token && { authToken: token }),
      });
      return client;
    })();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__crmRemoteDb = libsqlClient;
  }

  db = drizzleLibSQL(libsqlClient, { schema }) as DrizzleInstance;
} else {
  // Mode Local (SQLite avec better-sqlite3)
  const dbPath = databaseUrl.startsWith("file:")
    ? databaseUrl.slice(5)
    : path.resolve(process.cwd(), databaseUrl);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite =
    globalForDb.__crmSqlite ??
    (() => {
      const conn = new Database(dbPath);
      conn.pragma("journal_mode = WAL");
      conn.pragma("foreign_keys = ON");
      return conn;
    })();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__crmSqlite = sqlite;
  }

  db = drizzleBetterSqlite(sqlite, { schema }) as DrizzleInstance;
}

export { db, schema };
export * from "./schema";
