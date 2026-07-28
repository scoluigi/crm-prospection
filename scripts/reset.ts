/**
 * Vide toutes les tables (PostgreSQL). Usage : npm run db:reset
 */
import "./load-env";
import { db, activityLogs, sessions, calls, prospects, users } from "@/lib/db";

async function main() {
  await db.delete(activityLogs);
  await db.delete(sessions);
  await db.delete(calls);
  await db.delete(prospects);
  await db.delete(users);
  console.log("Base vidée. Lance `npm run db:seed` pour recharger les données de démo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
