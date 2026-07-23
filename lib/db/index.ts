import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const globalForDb = globalThis as unknown as {
  __crmDb?: Database.Database;
};

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/crm.db";

const sqliteDb =
  globalForDb.__crmDb ??
  (() => {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    // Run migrations automatically
    try {
      const migrationsPath = path.join(process.cwd(), "drizzle");
      migrate(drizzle(db, { schema }), {
        migrationsFolder: migrationsPath,
      });
    } catch (err) {
      console.warn("Migration warning:", err);
    }

    return db;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__crmDb = sqliteDb;
}

export const db = drizzle(sqliteDb, { schema });
export { schema };
export * from "./schema";
